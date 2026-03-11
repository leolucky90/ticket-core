import "server-only";
import type { QuoteStatus, Ticket, TicketStatus } from "@/lib/types/ticket";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth-enterprise/session.server";
import { getShowcaseTenantId, getUserDoc, toAccountType } from "@/lib/services/user.service";

const memory: { ticketsByCompany: Record<string, Ticket[]> } = { ticketsByCompany: {} };

const MAX_TEXT = 120;
const MAX_ADDRESS = 300;
const MAX_DETAIL = 1000;
const MAX_QUERY = 120;
const MAX_MONEY = 100000000;
const MAX_ID = 120;
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

function normalizeCompanyId(value: unknown): string | null {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (/[/?#]/.test(trimmed)) return null;
    return trimmed;
}

function normalizeLowerEmail(value: unknown): string {
    return safeText(toStr(value), MAX_TEXT).toLowerCase();
}

function composeTitle(customerName: string, deviceName: string): string {
    const left = customerName || "Customer";
    const right = deviceName || "Device";
    return `${left} - ${right}`;
}

function parseQuoteStatus(v: unknown): QuoteStatus {
    if (v === "quoted" || v === "rejected" || v === "accepted") return v;
    return "inspection_estimate";
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

const workflow: Record<TicketStatus, TicketStatus[]> = {
    new: ["in_progress", "closed"],
    in_progress: ["waiting_customer", "resolved", "closed"],
    waiting_customer: ["in_progress", "resolved", "closed"],
    resolved: ["closed", "in_progress"],
    closed: ["in_progress"],
};

function canTransition(current: TicketStatus, next: TicketStatus): boolean {
    if (current === next) return true;
    return workflow[current].includes(next);
}

function normalizeTicket(input: Partial<Ticket> & { id: string }): Ticket {
    const createdAt = typeof input.createdAt === "number" ? input.createdAt : now();
    const status: TicketStatus =
        input.status === "new" ||
        input.status === "in_progress" ||
        input.status === "waiting_customer" ||
        input.status === "resolved" ||
        input.status === "closed"
            ? input.status
            : "new";

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
    quoteStatus: QuoteStatus;
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
    const quoteStatus = parseQuoteStatus(payload.quoteStatus);

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

async function resolveSessionScope(requireCompany = true): Promise<SessionScope | null> {
    const session = await getSessionUser();
    if (!session) return null;

    const user = await getUserDoc(session.uid);
    if (!user) return null;

    const accountType = toAccountType(user.role);
    if (requireCompany && accountType !== "company") return null;

    const companyId = normalizeCompanyId(getShowcaseTenantId(user, session.uid));
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

function upsertMemoryTicket(companyId: string, ticket: Ticket): void {
    const list = memory.ticketsByCompany[companyId] ?? [];
    memory.ticketsByCompany[companyId] = [ticket, ...list.filter((item) => item.id !== ticket.id)];
}

function removeMemoryTicket(companyId: string, ticketId: string): boolean {
    const list = memory.ticketsByCompany[companyId] ?? [];
    const next = list.filter((ticket) => ticket.id !== ticketId);
    const removed = next.length !== list.length;
    memory.ticketsByCompany[companyId] = next;
    return removed;
}

function companyCasesRef(db: Awaited<ReturnType<typeof getFirestoreDb>>, companyId: string) {
    return db!.collection(`companies/${companyId}/cases`);
}

function companyCustomersRef(db: Awaited<ReturnType<typeof getFirestoreDb>>, companyId: string) {
    return db!.collection(`companies/${companyId}/customers`);
}

async function listFromFirebase(companyId: string): Promise<Ticket[] | null> {
    const db = await getFirestoreDb();
    if (!db) return null;

    const snap = await companyCasesRef(db, companyId).orderBy("createdAt", "desc").limit(200).get();
    return snap.docs.map((doc) =>
        normalizeTicket({
            id: doc.id,
            ...(doc.data() as Partial<Ticket>),
        }),
    );
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

    if (emailLower) {
        const existingByEmail = await customers.where("emailLower", "==", emailLower).limit(1).get();
        if (!existingByEmail.empty) {
            const doc = existingByEmail.docs[0];
            const current = (doc.data() ?? {}) as Partial<CompanyCustomerDoc>;
            const update: Partial<CompanyCustomerDoc> = {
                companyId,
                name: params.customerName || current.name || "未命名客戶",
                phone: params.customerPhone || current.phone || "",
                address: params.customerAddress || current.address || "",
                email: emailLower,
                emailLower,
                updatedAt: now(),
            };
            await doc.ref.set(update, { merge: true });
            return doc.id;
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
        repairAmount: number;
        inspectionFee: number;
        quoteStatus: QuoteStatus;
    },
): Promise<Ticket> {
    const ts = now();
    const ticket: Ticket = {
        id: id(),
        title: composeTitle(params.customerName, params.deviceName),
        status: "new",
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
        repairAmount: number;
        inspectionFee: number;
        quoteStatus: QuoteStatus;
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
        status: "new",
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
    batch.set(caseRef, ticket, { merge: false });
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

async function deleteInFirebase(companyId: string, ticketId: string): Promise<boolean | null> {
    const db = await getFirestoreDb();
    if (!db) return null;

    const ref = companyCasesRef(db, companyId).doc(ticketId);
    const snap = await ref.get();
    if (!snap.exists) return false;
    await ref.delete();
    return true;
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
    await ref.set(next, { merge: true });
    return next;
}

function filterTickets(tickets: Ticket[], keyword?: string): Ticket[] {
    const q = safeText(keyword ?? "", MAX_QUERY).toLowerCase();
    if (!q) return tickets;
    return tickets.filter((ticket) => {
        const haystack = [
            ticket.id,
            ticket.title,
            ticket.customer.name,
            ticket.customer.phone,
            ticket.customer.address,
            ticket.customer.email,
            ticket.device.name,
            ticket.device.model,
            ticket.repairReason,
            ticket.repairSuggestion,
            ticket.note,
            String(ticket.repairAmount),
            String(ticket.inspectionFee),
            String(ticket.pendingFee),
            ticket.quoteStatus,
            ticket.customerId ?? "",
            ticket.companyId ?? "",
        ]
            .join(" ")
            .toLowerCase();
        return haystack.includes(q);
    });
}

export async function listTickets(): Promise<Ticket[]> {
    const scope = await resolveSessionScope(true);
    if (!scope) return [];

    try {
        const firebaseTickets = await listFromFirebase(scope.companyId);
        if (firebaseTickets) return firebaseTickets;
    } catch {
        // fallback to memory
    }
    return listFromMemory(scope.companyId);
}

export async function queryTickets(keyword?: string): Promise<Ticket[]> {
    const tickets = await listTickets();
    return filterTickets(tickets, keyword);
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

export async function createTicket(formData: FormData): Promise<void> {
    "use server";

    const scope = await resolveSessionScope(true);
    if (!scope) {
        redirect(`/ticket?flash=invalid&ts=${Date.now()}`);
    }

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

    if (!validated) {
        redirect(`/ticket?flash=invalid&ts=${Date.now()}`);
    }

    try {
        const created = await createInFirebase(scope.companyId, validated);
        if (!created) await createInMemory(scope.companyId, validated);
    } catch {
        await createInMemory(scope.companyId, validated);
    }

    revalidatePath("/ticket");
    redirect(`/ticket?flash=created&ts=${Date.now()}`);
}

export async function deleteTicket(formData: FormData): Promise<void> {
    "use server";

    const scope = await resolveSessionScope(true);
    if (!scope) {
        redirect(`/ticket?flash=invalid&ts=${Date.now()}`);
    }

    const rawId = toStr(formData.get("id"));
    const ticketId = safeText(rawId, 80);
    if (!ticketId) {
        redirect(`/ticket?flash=invalid&ts=${Date.now()}`);
    }

    try {
        const removed = await deleteInFirebase(scope.companyId, ticketId);
        if (removed === null) removeMemoryTicket(scope.companyId, ticketId);
    } catch {
        removeMemoryTicket(scope.companyId, ticketId);
    }

    revalidatePath("/ticket");
    redirect(`/ticket?flash=deleted&ts=${Date.now()}`);
}

export async function updateTicket(formData: FormData): Promise<void> {
    "use server";

    const scope = await resolveSessionScope(true);
    if (!scope) {
        redirect(`/ticket?flash=invalid&ts=${Date.now()}`);
    }

    const rawId = toStr(formData.get("id"));
    const ticketId = safeText(rawId, 80);
    const status = formData.get("status");
    if (!ticketId) {
        redirect(`/ticket?flash=invalid&ts=${Date.now()}`);
    }

    const finalStatus: TicketStatus | undefined =
        status === "new" ||
        status === "in_progress" ||
        status === "waiting_customer" ||
        status === "resolved" ||
        status === "closed"
            ? status
            : undefined;

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
        repairAmount: formData.has("repairAmount") ? parseMoney(formData.get("repairAmount")) : undefined,
        inspectionFee: formData.has("inspectionFee") ? parseMoney(formData.get("inspectionFee")) : undefined,
        quoteStatus: formData.has("quoteStatus") ? parseQuoteStatus(formData.get("quoteStatus")) : undefined,
        status: finalStatus,
    };

    if (payload.customerPhone && !PHONE_RE.test(payload.customerPhone)) {
        redirect(`/ticket?flash=invalid&ts=${Date.now()}`);
    }
    if (payload.customerEmail && !EMAIL_RE.test(payload.customerEmail)) {
        redirect(`/ticket?flash=invalid&ts=${Date.now()}`);
    }

    try {
        const updated = await updateInFirebase(scope.companyId, payload);
        if (!updated) await updateInMemory(scope.companyId, payload);
    } catch {
        await updateInMemory(scope.companyId, payload);
    }

    revalidatePath("/ticket");
    redirect(`/ticket?flash=updated&ts=${Date.now()}`);
}

export async function checkTicketFirebaseConnection(): Promise<{ ok: boolean; detail: string }> {
    try {
        const scope = await resolveSessionScope(false);
        if (!scope) return { ok: false, detail: "No active session scope" };

        const db = await getFirestoreDb();
        if (!db) return { ok: false, detail: "Firebase Admin not available" };

        const snap = await companyCasesRef(db, scope.companyId).limit(1).get();
        return { ok: true, detail: `Connected. Read ${snap.size} doc(s) from companies/${scope.companyId}/cases.` };
    } catch (error: unknown) {
        const detail = error instanceof Error ? error.message : "Unknown error";
        return { ok: false, detail };
    }
}
