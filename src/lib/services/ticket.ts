import "server-only";
import { FieldPath } from "firebase-admin/firestore";
import type { KnownTicketStatus, QuoteStatus, Ticket, TicketStatus } from "@/lib/types/ticket";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth-enterprise/session.server";
import { normalizeCompanyId } from "@/lib/tenant-scope";
import { getUserCompanyId, getUserDoc, toAccountType } from "@/lib/services/user.service";
import { linkUsedProductToCase, syncUsedProductRefurbishmentStatus } from "@/lib/services/used-products.service";
import {
    DEFAULT_CASE_STATUSES,
    DEFAULT_QUOTE_STATUSES,
    getTicketAttributePreferences,
} from "@/lib/services/ticketAttributes";
import type { CursorPageResult } from "@/lib/types/pagination";

const memory: { ticketsByCompany: Record<string, Ticket[]> } = { ticketsByCompany: {} };
const READ_CACHE_TTL_MS = 30_000;
const readCacheTouchedAt: Record<string, number> = {};

const MAX_TEXT = 120;
const MAX_ADDRESS = 300;
const MAX_DETAIL = 1000;
const MAX_MONEY = 100000000;
const MAX_ID = 120;
const MAX_STATUS = 40;
const PHONE_RE = /^[0-9+\-()\s]{6,24}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type SessionScope = {
    uid: string;
    email: string;
    accountType: "company" | "customer";
    companyId: string;
};

type CompanyCustomerDoc = {
    id: string;
    companyId: string;
    userUid?: string;
    name: string;
    phone: string;
    address: string;
    email: string;
    emailLower: string;
    createdAt: number;
    updatedAt: number;
    lastCaseAt?: number;
};

type TicketCursor = {
    updatedAt: number;
    id: string;
};

type TicketPageQuery = {
    keyword?: string;
    status?: string;
    order?: "latest" | "earliest";
    pageSize?: number;
    cursor?: string;
};

function now() {
    return Date.now();
}

function id(prefix = "c") {
    return `${prefix}_${Math.random().toString(16).slice(2)}_${now()}`;
}

function toStr(v: unknown): string {
    return typeof v === "string" ? v.trim() : "";
}

function safeText(value: string, max: number): string {
    return value.replace(/[\u0000-\u001F\u007F]/g, "").slice(0, max).trim();
}

function toFirestoreData<T>(input: T): T {
    const walk = (value: unknown): unknown => {
        if (Array.isArray(value)) return value.map((item) => walk(item)).filter((item) => item !== undefined);
        if (value && typeof value === "object") {
            const out: Record<string, unknown> = {};
            for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
                const next = walk(raw);
                if (next !== undefined) out[key] = next;
            }
            return out;
        }
        if (value === undefined) return undefined;
        return value;
    };
    return walk(input) as T;
}

function normalizeLowerEmail(value: unknown): string {
    return safeText(toStr(value), MAX_TEXT).toLowerCase();
}

function composeTitle(customerName: string, deviceName: string): string {
    const left = customerName || "Customer";
    const right = deviceName || "Device";
    return `${left} - ${right}`;
}

function normalizeStatusValue(value: unknown): string {
    return safeText(toStr(value), MAX_STATUS);
}

function normalizeCaseIdList(value: unknown): string[] {
    const rows = Array.isArray(value)
        ? value
        : typeof value === "string"
          ? value.split(/[\n,]/g)
          : [];
    const seen = new Set<string>();
    const ids: string[] = [];
    for (const row of rows) {
        const id = safeText(toStr(row), MAX_ID);
        if (!id || seen.has(id)) continue;
        seen.add(id);
        ids.push(id);
        if (ids.length >= 50) break;
    }
    return ids;
}

function parseQuoteStatus(value: unknown): QuoteStatus {
    const normalized = normalizeStatusValue(value);
    if (!normalized) return "inspection_estimate";
    return normalized as QuoteStatus;
}

function parseTicketStatus(value: unknown): TicketStatus {
    const normalized = normalizeStatusValue(value);
    if (!normalized) return "new";
    return normalized as TicketStatus;
}

function isKnownTicketStatus(value: string): value is KnownTicketStatus {
    return (
        value === "new" ||
        value === "in_progress" ||
        value === "waiting_customer" ||
        value === "resolved" ||
        value === "closed"
    );
}

function parseMoney(v: unknown): number {
    const n = typeof v === "number" ? v : Number(toStr(v).replace(/,/g, ""));
    if (!Number.isFinite(n)) return 0;
    if (n < 0) return 0;
    if (n > MAX_MONEY) return MAX_MONEY;
    return Math.round(n);
}

function computePendingFee(repairAmount: number, inspectionFee: number): number {
    return repairAmount - inspectionFee;
}

const workflow: Record<KnownTicketStatus, KnownTicketStatus[]> = {
    new: ["in_progress", "closed"],
    in_progress: ["waiting_customer", "resolved", "closed"],
    waiting_customer: ["in_progress", "resolved", "closed"],
    resolved: ["closed", "in_progress"],
    closed: ["in_progress"],
};

function canTransition(current: TicketStatus, next: TicketStatus): boolean {
    if (current === next) return true;
    if (!isKnownTicketStatus(current) || !isKnownTicketStatus(next)) return true;
    return workflow[current].includes(next);
}

function normalizeTicket(input: Partial<Ticket> & { id: string }): Ticket {
    const createdAt = typeof input.createdAt === "number" ? input.createdAt : now();
    const status = parseTicketStatus(input.status);

    const customerName = safeText(toStr(input.customer?.name), MAX_TEXT) || "未命名客戶";
    const customerPhone = safeText(toStr(input.customer?.phone), MAX_TEXT);
    const customerAddress = safeText(toStr(input.customer?.address), MAX_ADDRESS);
    const customerEmail = normalizeLowerEmail(input.customer?.email);

    const deviceName = safeText(toStr(input.device?.name), MAX_TEXT) || "未命名設備";
    const deviceModel = safeText(toStr(input.device?.model), MAX_TEXT);
    const repairReason = safeText(toStr(input.repairReason), MAX_DETAIL);
    const repairSuggestion = safeText(toStr(input.repairSuggestion), MAX_DETAIL);
    const note = safeText(toStr(input.note), MAX_DETAIL);
    const repairAmount = parseMoney(input.repairAmount);
    const inspectionFee = parseMoney(input.inspectionFee);
    const quoteStatus = parseQuoteStatus(input.quoteStatus);
    const pendingFee = computePendingFee(repairAmount, inspectionFee);

    const extra = input as Record<string, unknown>;
    const companyId = safeText(toStr(extra.companyId), MAX_ID);
    const customerId = safeText(toStr(extra.customerId), MAX_ID);
    const repairTechnicianId = safeText(toStr(extra.repairTechnicianId), MAX_ID);
    const repairTechnicianName = safeText(toStr(extra.repairTechnicianName), MAX_TEXT);
    const linkedUsedProductId = safeText(toStr(extra.linkedUsedProductId), MAX_ID);
    const linkedUsedProductName = safeText(toStr(extra.linkedUsedProductName), MAX_TEXT);
    const parentCaseId = safeText(toStr(extra.parentCaseId), MAX_ID);
    const parentCaseTitle = safeText(toStr(extra.parentCaseTitle), MAX_TEXT);
    const relatedCaseIds = normalizeCaseIdList(extra.relatedCaseIds);
    const historySummary = safeText(toStr(extra.historySummary), MAX_DETAIL);
    const caseType = safeText(toStr(extra.caseType), MAX_STATUS);

    return {
        id: input.id,
        title: safeText(toStr(input.title), MAX_TEXT) || composeTitle(customerName, deviceName),
        status,
        customer: {
            name: customerName,
            phone: customerPhone,
            address: customerAddress,
            email: customerEmail,
        },
        device: {
            name: deviceName,
            model: deviceModel,
        },
        repairReason,
        repairSuggestion,
        note,
        repairTechnicianId: repairTechnicianId || undefined,
        repairTechnicianName: repairTechnicianName || undefined,
        linkedUsedProductId: linkedUsedProductId || undefined,
        linkedUsedProductName: linkedUsedProductName || undefined,
        parentCaseId: parentCaseId || undefined,
        parentCaseTitle: parentCaseTitle || undefined,
        relatedCaseIds: relatedCaseIds.length > 0 ? relatedCaseIds : undefined,
        historySummary: historySummary || undefined,
        caseType: caseType || undefined,
        repairAmount,
        inspectionFee,
        pendingFee,
        quoteStatus,
        companyId: companyId || undefined,
        customerId: customerId || undefined,
        createdAt,
        updatedAt: typeof input.updatedAt === "number" ? input.updatedAt : createdAt,
    };
}

function validateInput(payload: {
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    customerEmail: string;
    deviceName: string;
    deviceModel: string;
    repairReason: string;
    repairSuggestion: string;
    note: string;
    repairAmount: string;
    inspectionFee: string;
    quoteStatus: string;
}): {
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    customerEmail: string;
    deviceName: string;
    deviceModel: string;
    repairReason: string;
    repairSuggestion: string;
    note: string;
    repairAmount: number;
    inspectionFee: number;
    quoteStatus: string;
} | null {
    const customerName = safeText(payload.customerName, MAX_TEXT);
    const customerPhone = safeText(payload.customerPhone, MAX_TEXT);
    const customerAddress = safeText(payload.customerAddress, MAX_ADDRESS);
    const customerEmail = normalizeLowerEmail(payload.customerEmail);
    const deviceName = safeText(payload.deviceName, MAX_TEXT);
    const deviceModel = safeText(payload.deviceModel, MAX_TEXT);
    const repairReason = safeText(payload.repairReason, MAX_DETAIL);
    const repairSuggestion = safeText(payload.repairSuggestion, MAX_DETAIL);
    const note = safeText(payload.note, MAX_DETAIL);
    const repairAmount = parseMoney(payload.repairAmount);
    const inspectionFee = parseMoney(payload.inspectionFee);
    const quoteStatus = normalizeStatusValue(payload.quoteStatus);

    if (!customerName || !customerPhone || !deviceName || !deviceModel) return null;
    if (!PHONE_RE.test(customerPhone)) return null;
    if (customerEmail && !EMAIL_RE.test(customerEmail)) return null;

    return {
        customerName,
        customerPhone,
        customerAddress,
        customerEmail,
        deviceName,
        deviceModel,
        repairReason,
        repairSuggestion,
        note,
        repairAmount,
        inspectionFee,
        quoteStatus,
    };
}

function firstOrFallback(options: string[], fallback: string): string {
    for (const option of options) {
        const cleaned = normalizeStatusValue(option);
        if (cleaned) return cleaned;
    }
    return fallback;
}

function resolveAllowedStatus(input: unknown, options: string[], fallback: string): string {
    const allowed = options
        .map((item) => normalizeStatusValue(item))
        .filter((item) => item.length > 0);
    const normalizedInput = normalizeStatusValue(input);
    if (normalizedInput && allowed.includes(normalizedInput)) return normalizedInput;
    return firstOrFallback(allowed, fallback);
}

function isAllowedStatus(input: unknown, options: string[]): boolean {
    const normalizedInput = normalizeStatusValue(input);
    if (!normalizedInput) return false;
    return options
        .map((item) => normalizeStatusValue(item))
        .filter((item) => item.length > 0)
        .includes(normalizedInput);
}

async function resolveSessionScope(requireCompany = true): Promise<SessionScope | null> {
    const session = await getSessionUser();
    if (!session) return null;

    const user = await getUserDoc(session.uid);
    if (!user) return null;

    const accountType = toAccountType(user.role);
    if (requireCompany && accountType !== "company") return null;

    const companyId = normalizeCompanyId(getUserCompanyId(user, session.uid));
    if (!companyId) return null;

    return {
        uid: session.uid,
        email: session.email,
        accountType,
        companyId,
    };
}

async function getFirestoreDb() {
    try {
        const mod = await import("@/lib/firebase-server");
        return mod.fbAdminDb;
    } catch {
        return null;
    }
}

function listFromMemory(companyId: string): Ticket[] {
    return [...(memory.ticketsByCompany[companyId] ?? [])].sort((a, b) => b.createdAt - a.createdAt);
}

function hasFreshReadCache(companyId: string): boolean {
    const touchedAt = readCacheTouchedAt[companyId] ?? 0;
    return touchedAt > 0 && Date.now() - touchedAt <= READ_CACHE_TTL_MS;
}

function touchReadCache(companyId: string): void {
    readCacheTouchedAt[companyId] = Date.now();
}

function upsertMemoryTicket(companyId: string, ticket: Ticket): void {
    const list = memory.ticketsByCompany[companyId] ?? [];
    memory.ticketsByCompany[companyId] = [ticket, ...list.filter((item) => item.id !== ticket.id)];
    touchReadCache(companyId);
}

function companyCasesRef(db: Awaited<ReturnType<typeof getFirestoreDb>>, companyId: string) {
    return db!.collection(`companies/${companyId}/cases`);
}

function companyCustomersRef(db: Awaited<ReturnType<typeof getFirestoreDb>>, companyId: string) {
    return db!.collection(`companies/${companyId}/customers`);
}

function caseTypeLabel(caseType?: string): string {
    if (caseType === "refurbish") return "翻新";
    if (caseType === "warranty") return "保固";
    return "維修";
}

function summarizeCaseHistory(cases: Ticket[], limit = 5): string {
    return cases
        .slice(0, limit)
        .map((ticket) => {
            const date = ticket.updatedAt > 0 ? new Date(ticket.updatedAt).toISOString().slice(0, 10) : "";
            const parts = [
                [date, caseTypeLabel(ticket.caseType), ticket.id].filter((value) => value.length > 0).join(" "),
                ticket.repairReason ? `原因：${ticket.repairReason}` : "",
                ticket.repairSuggestion ? `處理：${ticket.repairSuggestion}` : "",
                ticket.note ? `備註：${ticket.note}` : "",
            ].filter((value) => value.length > 0);
            return parts.join(" / ");
        })
        .filter((value) => value.length > 0)
        .join("\n")
        .slice(0, MAX_DETAIL);
}

async function listRelatedTickets(companyId: string, input: {
    linkedUsedProductId?: string;
    customerId?: string;
    customerEmail?: string;
    customerPhone?: string;
    customerName?: string;
    deviceName?: string;
    deviceModel?: string;
}): Promise<Ticket[]> {
    const normalizedUsedProductId = safeText(toStr(input.linkedUsedProductId), MAX_ID);
    const normalizedCustomerId = safeText(toStr(input.customerId), MAX_ID);
    const normalizedEmail = normalizeLowerEmail(input.customerEmail);
    const normalizedPhone = safeText(toStr(input.customerPhone), MAX_TEXT);
    const normalizedName = safeText(toStr(input.customerName), MAX_TEXT).toLowerCase();
    const normalizedDeviceName = safeText(toStr(input.deviceName), MAX_TEXT).toLowerCase();
    const normalizedDeviceModel = safeText(toStr(input.deviceModel), MAX_TEXT).toLowerCase();

    let tickets: Ticket[] | null = null;
    try {
        tickets = await listFromFirebase(companyId);
    } catch {
        tickets = null;
    }
    if (!tickets) tickets = listFromMemory(companyId);

    return tickets
        .map((ticket) => normalizeTicket(ticket))
        .filter((ticket) => {
            if (normalizedUsedProductId && ticket.linkedUsedProductId === normalizedUsedProductId) return true;
            if (normalizedCustomerId && ticket.customerId === normalizedCustomerId) return true;
            if (normalizedEmail && ticket.customer.email === normalizedEmail) return true;
            if (normalizedPhone && ticket.customer.phone === normalizedPhone) return true;
            if (
                normalizedName &&
                normalizedDeviceName &&
                ticket.customer.name.trim().toLowerCase() === normalizedName &&
                ticket.device.name.trim().toLowerCase() === normalizedDeviceName &&
                ticket.device.model.trim().toLowerCase() === normalizedDeviceModel
            ) {
                return true;
            }
            return false;
        })
        .sort((a, b) => b.updatedAt - a.updatedAt);
}

async function getTicketByIdInternal(companyId: string, ticketId: string): Promise<Ticket | null> {
    const cleanedId = safeText(ticketId, MAX_ID);
    if (!cleanedId) return null;

    const db = await getFirestoreDb();
    if (db) {
        const snap = await companyCasesRef(db, companyId).doc(cleanedId).get();
        if (snap.exists) return normalizeTicket({ id: snap.id, ...(snap.data() as Partial<Ticket>) });
    }

    const current = listFromMemory(companyId).find((ticket) => ticket.id === cleanedId);
    return current ? normalizeTicket(current) : null;
}

async function deriveWarrantyHistory(companyId: string, sourceTicket: Ticket): Promise<{
    parentCaseId?: string;
    parentCaseTitle?: string;
    relatedCaseIds?: string[];
    historySummary?: string;
}> {
    const related = await listRelatedTickets(companyId, {
        linkedUsedProductId: sourceTicket.linkedUsedProductId,
        customerId: sourceTicket.customerId,
        customerEmail: sourceTicket.customer.email,
        customerPhone: sourceTicket.customer.phone,
        customerName: sourceTicket.customer.name,
        deviceName: sourceTicket.device.name,
        deviceModel: sourceTicket.device.model,
    });
    const withoutSelf = related.filter((ticket) => ticket.id !== sourceTicket.id);
    const sourceAndHistory = [sourceTicket, ...withoutSelf]
        .filter((ticket, index, rows) => rows.findIndex((row) => row.id === ticket.id) === index)
        .sort((a, b) => b.updatedAt - a.updatedAt);
    const relatedCaseIds = sourceAndHistory.map((ticket) => ticket.id).filter((id) => id !== sourceTicket.id);

    return {
        parentCaseId: sourceTicket.id,
        parentCaseTitle: sourceTicket.title,
        relatedCaseIds: [sourceTicket.id, ...relatedCaseIds].slice(0, 50),
        historySummary: summarizeCaseHistory(sourceAndHistory),
    };
}

async function listFromFirebase(companyId: string): Promise<Ticket[] | null> {
    const db = await getFirestoreDb();
    if (!db) return null;

    const snap = await companyCasesRef(db, companyId).orderBy("createdAt", "desc").limit(200).get();
    const rows = snap.docs.map((doc) =>
        normalizeTicket({
            id: doc.id,
            ...(doc.data() as Partial<Ticket>),
        }),
    );
    memory.ticketsByCompany[companyId] = rows;
    touchReadCache(companyId);
    return rows;
}

function normalizePageSize(input: number | undefined, fallback = 10): number {
    const value = Number(input);
    if (!Number.isFinite(value)) return fallback;
    if (value <= 5) return 5;
    if (value <= 10) return 10;
    if (value <= 15) return 15;
    return 20;
}

function encodeTicketCursorValue(cursor: TicketCursor): string {
    return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

function decodeTicketCursorValue(value: string | undefined): TicketCursor | null {
    const text = safeText(toStr(value), 240);
    if (!text) return null;
    try {
        const parsed = JSON.parse(Buffer.from(text, "base64url").toString("utf8")) as Partial<TicketCursor>;
        const updatedAt = Number(parsed.updatedAt);
        const idValue = safeText(toStr(parsed.id), MAX_ID);
        if (!Number.isFinite(updatedAt) || updatedAt <= 0 || !idValue) return null;
        return { updatedAt: Math.round(updatedAt), id: idValue };
    } catch {
        return null;
    }
}

function matchesTicketPageQuery(ticket: Ticket, params: TicketPageQuery): boolean {
    if (params.status && params.status !== "all" && ticket.status !== params.status) return false;
    const keyword = safeText(params.keyword ?? "", MAX_TEXT).toLowerCase();
    if (!keyword) return true;
    const haystack = [
        ticket.customer.name,
        ticket.customer.phone,
        ticket.customer.email,
        ticket.device.name,
        ticket.device.model,
        ticket.title,
        ticket.id,
        ticket.repairReason,
        ticket.repairSuggestion,
        ticket.note,
        ticket.linkedUsedProductId ?? "",
        ticket.linkedUsedProductName ?? "",
        ticket.parentCaseId ?? "",
        ticket.parentCaseTitle ?? "",
        (ticket.relatedCaseIds ?? []).join(" "),
        ticket.historySummary ?? "",
        ticket.caseType ?? "",
    ]
        .join(" ")
        .toLowerCase();
    return haystack.includes(keyword);
}

async function findOrCreateCustomerId(
    db: NonNullable<Awaited<ReturnType<typeof getFirestoreDb>>>,
    companyId: string,
    params: {
        customerName: string;
        customerPhone: string;
        customerAddress: string;
        customerEmail: string;
    },
): Promise<string> {
    const customers = companyCustomersRef(db, companyId);
    const emailLower = normalizeLowerEmail(params.customerEmail);
    const phone = safeText(params.customerPhone, MAX_TEXT);
    const name = safeText(params.customerName, MAX_TEXT);

    const mergeExistingCustomer = async (doc: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>): Promise<string> => {
        const current = (doc.data() ?? {}) as Partial<CompanyCustomerDoc>;
        const update: Partial<CompanyCustomerDoc> = {
            companyId,
            name: name || current.name || "未命名客戶",
            phone: phone || current.phone || "",
            address: params.customerAddress || current.address || "",
            email: emailLower || current.email || "",
            emailLower: emailLower || current.emailLower || "",
            updatedAt: now(),
        };
        await doc.ref.set(update, { merge: true });
        return doc.id;
    };

    if (emailLower) {
        const existingByEmail = await customers.where("emailLower", "==", emailLower).limit(1).get();
        if (!existingByEmail.empty) {
            return mergeExistingCustomer(existingByEmail.docs[0]);
        }
    }

    if (phone) {
        const existingByPhone = await customers.where("phone", "==", phone).limit(1).get();
        if (!existingByPhone.empty) {
            return mergeExistingCustomer(existingByPhone.docs[0]);
        }
    }

    if (name) {
        const existingByName = await customers.where("name", "==", name).limit(5).get();
        const matchedByName = existingByName.docs.find((doc) => {
            const current = (doc.data() ?? {}) as Partial<CompanyCustomerDoc>;
            return !phone || safeText(current.phone ?? "", MAX_TEXT) === phone;
        });
        if (matchedByName) {
            return mergeExistingCustomer(matchedByName);
        }
    }

    const customerId = id("cx");
    const ts = now();
    const customerDoc: CompanyCustomerDoc = {
        id: customerId,
        companyId,
        name: params.customerName || "未命名客戶",
        phone: params.customerPhone,
        address: params.customerAddress,
        email: emailLower,
        emailLower,
        createdAt: ts,
        updatedAt: ts,
        lastCaseAt: ts,
    };
    await customers.doc(customerId).set(customerDoc, { merge: false });
    return customerId;
}

async function createInMemory(
    companyId: string,
    params: {
        customerName: string;
        customerPhone: string;
        customerAddress: string;
        customerEmail: string;
        deviceName: string;
        deviceModel: string;
        repairReason: string;
        repairSuggestion: string;
        note: string;
        repairTechnicianId?: string;
        repairTechnicianName?: string;
        linkedUsedProductId?: string;
        linkedUsedProductName?: string;
        parentCaseId?: string;
        parentCaseTitle?: string;
        relatedCaseIds?: string[];
        historySummary?: string;
        caseType?: string;
        repairAmount: number;
        inspectionFee: number;
        quoteStatus: QuoteStatus;
        status: TicketStatus;
    },
): Promise<Ticket> {
    const ts = now();
    const ticket: Ticket = {
        id: id(),
        title: composeTitle(params.customerName, params.deviceName),
        status: params.status,
        customer: {
            name: params.customerName,
            phone: params.customerPhone,
            address: params.customerAddress,
            email: params.customerEmail,
        },
        device: {
            name: params.deviceName,
            model: params.deviceModel,
        },
        repairReason: params.repairReason,
        repairSuggestion: params.repairSuggestion,
        note: params.note,
        repairTechnicianId: params.repairTechnicianId,
        repairTechnicianName: params.repairTechnicianName,
        linkedUsedProductId: params.linkedUsedProductId,
        linkedUsedProductName: params.linkedUsedProductName,
        parentCaseId: params.parentCaseId,
        parentCaseTitle: params.parentCaseTitle,
        relatedCaseIds: params.relatedCaseIds,
        historySummary: params.historySummary,
        caseType: params.caseType,
        repairAmount: params.repairAmount,
        inspectionFee: params.inspectionFee,
        pendingFee: computePendingFee(params.repairAmount, params.inspectionFee),
        quoteStatus: params.quoteStatus,
        companyId,
        customerId: id("cx"),
        createdAt: ts,
        updatedAt: ts,
    };
    upsertMemoryTicket(companyId, ticket);
    return ticket;
}

async function createInFirebase(
    companyId: string,
    params: {
        customerName: string;
        customerPhone: string;
        customerAddress: string;
        customerEmail: string;
        deviceName: string;
        deviceModel: string;
        repairReason: string;
        repairSuggestion: string;
        note: string;
        repairTechnicianId?: string;
        repairTechnicianName?: string;
        linkedUsedProductId?: string;
        linkedUsedProductName?: string;
        parentCaseId?: string;
        parentCaseTitle?: string;
        relatedCaseIds?: string[];
        historySummary?: string;
        caseType?: string;
        repairAmount: number;
        inspectionFee: number;
        quoteStatus: QuoteStatus;
        status: TicketStatus;
    },
): Promise<Ticket | null> {
    const db = await getFirestoreDb();
    if (!db) return null;

    const customerId = await findOrCreateCustomerId(db, companyId, {
        customerName: params.customerName,
        customerPhone: params.customerPhone,
        customerAddress: params.customerAddress,
        customerEmail: params.customerEmail,
    });

    const ts = now();
    const docId = id();
    const ticket: Ticket = {
        id: docId,
        title: composeTitle(params.customerName, params.deviceName),
        status: params.status,
        customer: {
            name: params.customerName,
            phone: params.customerPhone,
            address: params.customerAddress,
            email: params.customerEmail,
        },
        device: {
            name: params.deviceName,
            model: params.deviceModel,
        },
        repairReason: params.repairReason,
        repairSuggestion: params.repairSuggestion,
        note: params.note,
        repairTechnicianId: params.repairTechnicianId,
        repairTechnicianName: params.repairTechnicianName,
        linkedUsedProductId: params.linkedUsedProductId,
        linkedUsedProductName: params.linkedUsedProductName,
        parentCaseId: params.parentCaseId,
        parentCaseTitle: params.parentCaseTitle,
        relatedCaseIds: params.relatedCaseIds,
        historySummary: params.historySummary,
        caseType: params.caseType,
        repairAmount: params.repairAmount,
        inspectionFee: params.inspectionFee,
        pendingFee: computePendingFee(params.repairAmount, params.inspectionFee),
        quoteStatus: params.quoteStatus,
        companyId,
        customerId,
        createdAt: ts,
        updatedAt: ts,
    };

    const batch = db.batch();
    const caseRef = companyCasesRef(db, companyId).doc(docId);
    const customerRef = companyCustomersRef(db, companyId).doc(customerId);
    batch.set(caseRef, toFirestoreData(ticket), { merge: false });
    batch.set(
        customerRef,
        {
            id: customerId,
            companyId,
            name: params.customerName,
            phone: params.customerPhone,
            address: params.customerAddress,
            email: params.customerEmail,
            emailLower: params.customerEmail,
            updatedAt: ts,
            lastCaseAt: ts,
        },
        { merge: true },
    );
    await batch.commit();
    return ticket;
}

async function updateInMemory(
    companyId: string,
    params: {
        id: string;
        customerName?: string;
        customerPhone?: string;
        customerAddress?: string;
        customerEmail?: string;
        deviceName?: string;
        deviceModel?: string;
        repairReason?: string;
        repairSuggestion?: string;
        note?: string;
        repairTechnicianId?: string;
        repairTechnicianName?: string;
        linkedUsedProductId?: string;
        linkedUsedProductName?: string;
        parentCaseId?: string;
        parentCaseTitle?: string;
        relatedCaseIds?: string[];
        historySummary?: string;
        caseType?: string;
        repairAmount?: number;
        inspectionFee?: number;
        quoteStatus?: QuoteStatus;
        status?: TicketStatus;
    },
): Promise<Ticket | null> {
    const list = memory.ticketsByCompany[companyId] ?? [];
    const target = list.find((ticket) => ticket.id === params.id);
    if (!target) return null;

    const nextStatus = params.status ?? target.status;
    if (!canTransition(target.status, nextStatus)) return null;

    if (params.customerName && params.customerName.trim()) target.customer.name = params.customerName.trim();
    if (params.customerPhone !== undefined) target.customer.phone = params.customerPhone;
    if (params.customerAddress !== undefined) target.customer.address = params.customerAddress;
    if (params.customerEmail !== undefined) target.customer.email = normalizeLowerEmail(params.customerEmail);
    if (params.deviceName && params.deviceName.trim()) target.device.name = params.deviceName.trim();
    if (params.deviceModel !== undefined) target.device.model = params.deviceModel;
    if (params.repairReason !== undefined) target.repairReason = params.repairReason;
    if (params.repairSuggestion !== undefined) target.repairSuggestion = params.repairSuggestion;
    if (params.note !== undefined) target.note = params.note;
    if (params.repairTechnicianId !== undefined) target.repairTechnicianId = params.repairTechnicianId;
    if (params.repairTechnicianName !== undefined) target.repairTechnicianName = params.repairTechnicianName;
    if (params.linkedUsedProductId !== undefined) target.linkedUsedProductId = params.linkedUsedProductId;
    if (params.linkedUsedProductName !== undefined) target.linkedUsedProductName = params.linkedUsedProductName;
    if (params.parentCaseId !== undefined) target.parentCaseId = params.parentCaseId;
    if (params.parentCaseTitle !== undefined) target.parentCaseTitle = params.parentCaseTitle;
    if (params.relatedCaseIds !== undefined) target.relatedCaseIds = params.relatedCaseIds;
    if (params.historySummary !== undefined) target.historySummary = params.historySummary;
    if (params.caseType !== undefined) target.caseType = params.caseType;
    if (params.repairAmount !== undefined) target.repairAmount = params.repairAmount;
    if (params.inspectionFee !== undefined) target.inspectionFee = params.inspectionFee;
    if (params.quoteStatus !== undefined) target.quoteStatus = params.quoteStatus;

    target.status = nextStatus;
    target.title = composeTitle(target.customer.name, target.device.name);
    target.pendingFee = computePendingFee(target.repairAmount, target.inspectionFee);
    target.updatedAt = now();
    upsertMemoryTicket(companyId, target);
    return target;
}

async function updateInFirebase(
    companyId: string,
    params: {
        id: string;
        customerName?: string;
        customerPhone?: string;
        customerAddress?: string;
        customerEmail?: string;
        deviceName?: string;
        deviceModel?: string;
        repairReason?: string;
        repairSuggestion?: string;
        note?: string;
        repairTechnicianId?: string;
        repairTechnicianName?: string;
        linkedUsedProductId?: string;
        linkedUsedProductName?: string;
        parentCaseId?: string;
        parentCaseTitle?: string;
        relatedCaseIds?: string[];
        historySummary?: string;
        caseType?: string;
        repairAmount?: number;
        inspectionFee?: number;
        quoteStatus?: QuoteStatus;
        status?: TicketStatus;
    },
): Promise<Ticket | null> {
    const db = await getFirestoreDb();
    if (!db) return null;

    const ref = companyCasesRef(db, companyId).doc(params.id);
    const snap = await ref.get();
    if (!snap.exists) return null;

    const current = normalizeTicket({ id: snap.id, ...(snap.data() as Partial<Ticket>) });
    const nextStatus = params.status ?? current.status;
    if (!canTransition(current.status, nextStatus)) return null;

    const next: Ticket = {
        ...current,
        customer: {
            name: params.customerName && params.customerName.trim() ? params.customerName.trim() : current.customer.name,
            phone: params.customerPhone !== undefined ? params.customerPhone : current.customer.phone,
            address: params.customerAddress !== undefined ? params.customerAddress : current.customer.address,
            email: params.customerEmail !== undefined ? normalizeLowerEmail(params.customerEmail) : current.customer.email,
        },
        device: {
            name: params.deviceName && params.deviceName.trim() ? params.deviceName.trim() : current.device.name,
            model: params.deviceModel !== undefined ? params.deviceModel : current.device.model,
        },
        repairReason: params.repairReason !== undefined ? params.repairReason : current.repairReason,
        repairSuggestion: params.repairSuggestion !== undefined ? params.repairSuggestion : current.repairSuggestion,
        note: params.note !== undefined ? params.note : current.note,
        repairTechnicianId: params.repairTechnicianId !== undefined ? params.repairTechnicianId : current.repairTechnicianId,
        repairTechnicianName: params.repairTechnicianName !== undefined ? params.repairTechnicianName : current.repairTechnicianName,
        linkedUsedProductId: params.linkedUsedProductId !== undefined ? params.linkedUsedProductId : current.linkedUsedProductId,
        linkedUsedProductName: params.linkedUsedProductName !== undefined ? params.linkedUsedProductName : current.linkedUsedProductName,
        parentCaseId: params.parentCaseId !== undefined ? params.parentCaseId : current.parentCaseId,
        parentCaseTitle: params.parentCaseTitle !== undefined ? params.parentCaseTitle : current.parentCaseTitle,
        relatedCaseIds: params.relatedCaseIds !== undefined ? params.relatedCaseIds : current.relatedCaseIds,
        historySummary: params.historySummary !== undefined ? params.historySummary : current.historySummary,
        caseType: params.caseType !== undefined ? params.caseType : current.caseType,
        repairAmount: params.repairAmount !== undefined ? params.repairAmount : current.repairAmount,
        inspectionFee: params.inspectionFee !== undefined ? params.inspectionFee : current.inspectionFee,
        quoteStatus: params.quoteStatus !== undefined ? params.quoteStatus : current.quoteStatus,
        status: nextStatus,
        updatedAt: now(),
        companyId,
        customerId: current.customerId,
    };

    next.title = composeTitle(next.customer.name, next.device.name);
    next.pendingFee = computePendingFee(next.repairAmount, next.inspectionFee);
    await ref.set(toFirestoreData(next), { merge: true });
    return next;
}

export async function listTickets(): Promise<Ticket[]> {
    const scope = await resolveSessionScope(true);
    if (!scope) return [];

    if (hasFreshReadCache(scope.companyId)) {
        return listFromMemory(scope.companyId);
    }

    try {
        const firebaseTickets = await listFromFirebase(scope.companyId);
        if (firebaseTickets) return firebaseTickets;
    } catch {
        // fallback to memory
    }
    return listFromMemory(scope.companyId);
}

export async function queryTicketsPage(params: TicketPageQuery = {}): Promise<CursorPageResult<Ticket>> {
    const scope = await resolveSessionScope(true);
    const pageSize = normalizePageSize(params.pageSize, 10);
    if (!scope) {
        return {
            items: [],
            pageSize,
            nextCursor: "",
            hasNextPage: false,
        };
    }

    const direction: "asc" | "desc" = params.order === "earliest" ? "asc" : "desc";
    const decodedCursor = decodeTicketCursorValue(params.cursor);
    const db = await getFirestoreDb();

    if (db) {
        const batchSize = Math.max(pageSize * 3, 30);
        const buildBaseQuery = () => {
            let query = companyCasesRef(db, scope.companyId).orderBy("updatedAt", direction).orderBy(FieldPath.documentId(), direction);
            if (params.status && params.status !== "all") query = query.where("status", "==", params.status);
            return query;
        };

        let query = buildBaseQuery();
        if (decodedCursor) query = query.startAfter(decodedCursor.updatedAt, decodedCursor.id);
        const items: Ticket[] = [];

        for (let round = 0; round < 8; round += 1) {
            const snap = await query.limit(batchSize).get();
            if (snap.empty) break;

            const docs = snap.docs;
            let lastCursorInBatch: TicketCursor | null = null;

            for (let index = 0; index < docs.length; index += 1) {
                const doc = docs[index];
                const ticket = normalizeTicket({ id: doc.id, ...(doc.data() as Partial<Ticket>) });
                lastCursorInBatch = { updatedAt: ticket.updatedAt, id: ticket.id };
                if (!matchesTicketPageQuery(ticket, params)) continue;
                items.push(ticket);
                if (items.length >= pageSize) {
                    const hasNextPage = index < docs.length - 1 || docs.length === batchSize;
                    return {
                        items,
                        pageSize,
                        nextCursor: hasNextPage && lastCursorInBatch ? encodeTicketCursorValue(lastCursorInBatch) : "",
                        hasNextPage,
                    };
                }
            }

            if (!lastCursorInBatch || docs.length < batchSize) break;
            query = buildBaseQuery().startAfter(lastCursorInBatch.updatedAt, lastCursorInBatch.id);
        }

        return {
            items,
            pageSize,
            nextCursor: "",
            hasNextPage: false,
        };
    }

    const ordered = listFromMemory(scope.companyId)
        .map((item) => normalizeTicket(item))
        .filter((ticket) => matchesTicketPageQuery(ticket, params))
        .sort((left, right) => {
            if (left.updatedAt === right.updatedAt) return direction === "desc" ? right.id.localeCompare(left.id) : left.id.localeCompare(right.id);
            return direction === "desc" ? right.updatedAt - left.updatedAt : left.updatedAt - right.updatedAt;
        });
    const startIndex = decodedCursor
        ? Math.max(
              0,
              ordered.findIndex((item) => item.id === decodedCursor.id) + 1,
          )
        : 0;
    const items = ordered.slice(startIndex, startIndex + pageSize);
    const lastItem = items.at(-1);
    const hasNextPage = startIndex + pageSize < ordered.length;
    return {
        items,
        pageSize,
        nextCursor: hasNextPage && lastItem ? encodeTicketCursorValue({ updatedAt: lastItem.updatedAt, id: lastItem.id }) : "",
        hasNextPage,
    };
}

export async function listTicketsByCustomerEmail(email: string, companyId?: string | null): Promise<Ticket[]> {
    const normalized = normalizeLowerEmail(email);
    if (!normalized) return [];

    const scopedCompanyId = normalizeCompanyId(companyId);
    const activeCompanyId = scopedCompanyId ?? (await resolveSessionScope(false))?.companyId ?? null;
    if (!activeCompanyId) return [];

    try {
        const firebaseTickets = await listFromFirebase(activeCompanyId);
        if (firebaseTickets) {
            return firebaseTickets.filter((ticket) => ticket.customer.email.trim().toLowerCase() === normalized);
        }
    } catch {
        // fallback to memory
    }

    const tickets = listFromMemory(activeCompanyId);
    return tickets.filter((ticket) => ticket.customer.email.trim().toLowerCase() === normalized);
}

export async function setTicketStatusById(ticketId: string, status: TicketStatus): Promise<boolean> {
    const scope = await resolveSessionScope(true);
    if (!scope) return false;

    const cleanedId = safeText(ticketId, 80);
    if (!cleanedId) return false;

    try {
        const updated = await updateInFirebase(scope.companyId, {
            id: cleanedId,
            status,
        });
        if (updated) return true;
    } catch {
        // fallback to memory
    }

    const updatedInMemory = await updateInMemory(scope.companyId, {
        id: cleanedId,
        status,
    });
    return Boolean(updatedInMemory);
}

export async function createWarrantyCaseFromExistingCase(input: { sourceCaseId: string }): Promise<Ticket | null> {
    const scope = await resolveSessionScope(true);
    if (!scope) return null;

    const sourceCaseId = safeText(input.sourceCaseId, MAX_ID);
    if (!sourceCaseId) return null;

    const source = await getTicketByIdInternal(scope.companyId, sourceCaseId);
    if (!source) return null;

    const history = await deriveWarrantyHistory(scope.companyId, source);
    const createdAt = now();
    const nextTicket: Ticket = normalizeTicket({
        id: id(),
        title: `保固 - ${source.device.name || source.title}`,
        status: "new",
        companyId: scope.companyId,
        customerId: source.customerId,
        customer: source.customer,
        device: source.device,
        repairReason: `保固申請 / 原案件 ${source.id}`,
        repairSuggestion: source.repairSuggestion || "",
        note: [`由原案件建立：${source.id}`, source.note || ""].filter((value) => value.length > 0).join("\n"),
        repairTechnicianId: source.repairTechnicianId,
        repairTechnicianName: source.repairTechnicianName,
        linkedUsedProductId: source.linkedUsedProductId,
        linkedUsedProductName: source.linkedUsedProductName,
        parentCaseId: history.parentCaseId,
        parentCaseTitle: history.parentCaseTitle,
        relatedCaseIds: history.relatedCaseIds,
        historySummary: history.historySummary,
        caseType: "warranty",
        repairAmount: 0,
        inspectionFee: 0,
        quoteStatus: "inspection_estimate",
        createdAt,
        updatedAt: createdAt,
    });

    const db = await getFirestoreDb();
    if (db) {
        const batch = db.batch();
        batch.set(companyCasesRef(db, scope.companyId).doc(nextTicket.id), toFirestoreData(nextTicket), { merge: false });
        if (source.customerId) {
            batch.set(
                companyCustomersRef(db, scope.companyId).doc(source.customerId),
                {
                    id: source.customerId,
                    companyId: scope.companyId,
                    name: source.customer.name,
                    phone: source.customer.phone,
                    address: source.customer.address,
                    email: source.customer.email,
                    emailLower: normalizeLowerEmail(source.customer.email),
                    updatedAt: createdAt,
                    lastCaseAt: createdAt,
                },
                { merge: true },
            );
        }
        await batch.commit();
        return nextTicket;
    }

    upsertMemoryTicket(scope.companyId, nextTicket);
    return nextTicket;
}

export async function createTicket(formData: FormData): Promise<void> {
    "use server";

    const redirectPath = safeText(toStr(formData.get("redirectPath")), 120);
    const redirectTab = safeText(toStr(formData.get("redirectTab")), 40) || "cases";
    const useDashboardRedirect = redirectPath === "/dashboard";
    const redirectWithFlash = (flash: "invalid" | "created"): never => {
        const tab = useDashboardRedirect ? redirectTab : "cases";
        redirect(`/dashboard?tab=${encodeURIComponent(tab)}&flash=${flash}&ts=${Date.now()}`);
    };

    const scope = await resolveSessionScope(true);
    const ensuredScope = scope ?? redirectWithFlash("invalid");
    const ticketAttributePreferences = await getTicketAttributePreferences({ tenantId: ensuredScope.companyId });
    const allowedCaseStatuses = ticketAttributePreferences.caseStatuses;
    const allowedQuoteStatuses = ticketAttributePreferences.quoteStatuses;

    const validated = validateInput({
        customerName: toStr(formData.get("customerName")),
        customerPhone: toStr(formData.get("customerPhone")),
        customerAddress: toStr(formData.get("customerAddress")),
        customerEmail: toStr(formData.get("customerEmail")),
        deviceName: toStr(formData.get("deviceName")),
        deviceModel: toStr(formData.get("deviceModel")),
        repairReason: toStr(formData.get("repairReason")),
        repairSuggestion: toStr(formData.get("repairSuggestion")),
        note: toStr(formData.get("note")),
        repairAmount: toStr(formData.get("repairAmount")),
        inspectionFee: toStr(formData.get("inspectionFee")),
        quoteStatus: toStr(formData.get("quoteStatus")),
    });
    const ensuredValidated = validated ?? redirectWithFlash("invalid");
    const selectedCaseStatus = resolveAllowedStatus(allowedCaseStatuses[0], allowedCaseStatuses, DEFAULT_CASE_STATUSES[0]) as TicketStatus;
    const selectedQuoteStatus = resolveAllowedStatus(
        ensuredValidated.quoteStatus,
        allowedQuoteStatuses,
        DEFAULT_QUOTE_STATUSES[0],
    ) as QuoteStatus;
    const repairTechnicianId = safeText(toStr(formData.get("repairTechnicianId")), MAX_ID);
    const repairTechnicianName = safeText(toStr(formData.get("repairTechnicianName")), MAX_TEXT);
    const linkedUsedProductId = safeText(toStr(formData.get("linkedUsedProductId")), MAX_ID);
    const linkedUsedProductName = safeText(toStr(formData.get("linkedUsedProductName")), MAX_TEXT);
    const parentCaseId = safeText(toStr(formData.get("parentCaseId")), MAX_ID);
    const parentCaseTitle = safeText(toStr(formData.get("parentCaseTitle")), MAX_TEXT);
    const relatedCaseIds = normalizeCaseIdList(formData.getAll("relatedCaseIds[]"));
    const historySummary = safeText(toStr(formData.get("historySummary")), MAX_DETAIL);
    const caseType = safeText(toStr(formData.get("caseType")), MAX_STATUS);
    const payload = {
        ...ensuredValidated,
        status: selectedCaseStatus,
        quoteStatus: selectedQuoteStatus,
        repairTechnicianId: repairTechnicianId || undefined,
        repairTechnicianName: repairTechnicianName || undefined,
        linkedUsedProductId: linkedUsedProductId || undefined,
        linkedUsedProductName: linkedUsedProductName || undefined,
        parentCaseId: parentCaseId || undefined,
        parentCaseTitle: parentCaseTitle || undefined,
        relatedCaseIds: relatedCaseIds.length > 0 ? relatedCaseIds : undefined,
        historySummary: historySummary || undefined,
        caseType: caseType || undefined,
    };

    let createdTicket: Ticket | null = null;
    try {
        createdTicket = await createInFirebase(ensuredScope.companyId, payload);
        if (!createdTicket) createdTicket = await createInMemory(ensuredScope.companyId, payload);
    } catch {
        createdTicket = await createInMemory(ensuredScope.companyId, payload);
    }

    if (createdTicket?.linkedUsedProductId && createdTicket.caseType === "refurbish") {
        try {
            await linkUsedProductToCase({
                usedProductId: createdTicket.linkedUsedProductId,
                caseId: createdTicket.id,
                caseTitle: createdTicket.title,
            });
            await syncUsedProductRefurbishmentStatus({
                usedProductId: createdTicket.linkedUsedProductId,
                caseStatus: createdTicket.status,
                caseId: createdTicket.id,
            });
        } catch {
            // ignore used-product sync failure
        }
    }

    revalidatePath("/dashboard");
    redirectWithFlash("created");
}

export async function updateTicket(formData: FormData): Promise<void> {
    "use server";

    const redirectPath = safeText(toStr(formData.get("redirectPath")), 120);
    const redirectTab = safeText(toStr(formData.get("redirectTab")), 40) || "cases";
    const useDashboardRedirect = redirectPath === "/dashboard";
    const redirectWithFlash = (flash: "invalid" | "updated"): never => {
        const tab = useDashboardRedirect ? redirectTab : "cases";
        const dashboardFlash = flash === "updated" ? "case_updated" : "invalid";
        redirect(`/dashboard?tab=${encodeURIComponent(tab)}&flash=${dashboardFlash}&ts=${Date.now()}`);
    };

    const scope = await resolveSessionScope(true);
    const ensuredScope = scope ?? redirectWithFlash("invalid");
    const ticketAttributePreferences = await getTicketAttributePreferences({ tenantId: ensuredScope.companyId });
    const allowedCaseStatuses = ticketAttributePreferences.caseStatuses;
    const allowedQuoteStatuses = ticketAttributePreferences.quoteStatuses;

    const rawId = toStr(formData.get("id"));
    const ticketId = safeText(rawId, 80);
    const status = formData.has("status") ? formData.get("status") : null;
    const quoteStatus = formData.has("quoteStatus") ? formData.get("quoteStatus") : null;
    if (!ticketId) {
        redirectWithFlash("invalid");
    }

    if (status !== null && !isAllowedStatus(status, allowedCaseStatuses)) {
        redirectWithFlash("invalid");
    }

    if (quoteStatus !== null && !isAllowedStatus(quoteStatus, allowedQuoteStatuses)) {
        redirectWithFlash("invalid");
    }

    const finalStatus = status !== null ? (normalizeStatusValue(status) as TicketStatus) : undefined;
    const finalQuoteStatus = quoteStatus !== null ? (normalizeStatusValue(quoteStatus) as QuoteStatus) : undefined;

    const getOptional = (key: string, max: number): string | undefined => {
        if (!formData.has(key)) return undefined;
        return safeText(toStr(formData.get(key)), max);
    };

    const payload = {
        id: ticketId,
        customerName: getOptional("customerName", MAX_TEXT) || undefined,
        customerPhone: getOptional("customerPhone", MAX_TEXT),
        customerAddress: getOptional("customerAddress", MAX_ADDRESS),
        customerEmail: formData.has("customerEmail") ? normalizeLowerEmail(formData.get("customerEmail")) : undefined,
        deviceName: getOptional("deviceName", MAX_TEXT) || undefined,
        deviceModel: getOptional("deviceModel", MAX_TEXT),
        repairReason: getOptional("repairReason", MAX_DETAIL),
        repairSuggestion: getOptional("repairSuggestion", MAX_DETAIL),
        note: getOptional("note", MAX_DETAIL),
        repairTechnicianId: getOptional("repairTechnicianId", MAX_ID),
        repairTechnicianName: getOptional("repairTechnicianName", MAX_TEXT),
        linkedUsedProductId: getOptional("linkedUsedProductId", MAX_ID),
        linkedUsedProductName: getOptional("linkedUsedProductName", MAX_TEXT),
        parentCaseId: getOptional("parentCaseId", MAX_ID),
        parentCaseTitle: getOptional("parentCaseTitle", MAX_TEXT),
        relatedCaseIds: formData.has("relatedCaseIds[]") ? normalizeCaseIdList(formData.getAll("relatedCaseIds[]")) : undefined,
        historySummary: getOptional("historySummary", MAX_DETAIL),
        caseType: getOptional("caseType", MAX_STATUS),
        repairAmount: formData.has("repairAmount") ? parseMoney(formData.get("repairAmount")) : undefined,
        inspectionFee: formData.has("inspectionFee") ? parseMoney(formData.get("inspectionFee")) : undefined,
        quoteStatus: finalQuoteStatus,
        status: finalStatus,
    };

    if (payload.customerPhone && !PHONE_RE.test(payload.customerPhone)) {
        redirectWithFlash("invalid");
    }
    if (payload.customerEmail && !EMAIL_RE.test(payload.customerEmail)) {
        redirectWithFlash("invalid");
    }

    let updatedTicket: Ticket | null = null;
    try {
        updatedTicket = await updateInFirebase(ensuredScope.companyId, payload);
        if (!updatedTicket) updatedTicket = await updateInMemory(ensuredScope.companyId, payload);
    } catch {
        updatedTicket = await updateInMemory(ensuredScope.companyId, payload);
    }

    if (updatedTicket?.linkedUsedProductId && updatedTicket.caseType === "refurbish") {
        try {
            await syncUsedProductRefurbishmentStatus({
                usedProductId: updatedTicket.linkedUsedProductId,
                caseStatus: updatedTicket.status,
                caseId: updatedTicket.id,
            });
        } catch {
            // ignore used-product sync failure
        }
    }

    revalidatePath("/dashboard");
    redirectWithFlash("updated");
}
