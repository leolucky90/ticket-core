import "server-only";
import type { QuoteStatus, Ticket, TicketStatus } from "@/lib/types/ticket";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const memory: { tickets: Ticket[] } = { tickets: [] };

const MAX_TEXT = 120;
const MAX_ADDRESS = 300;
const MAX_DETAIL = 1000;
const MAX_QUERY = 120;
const MAX_MONEY = 100000000;
const PHONE_RE = /^[0-9+\-()\s]{6,24}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function now() {
    return Date.now();
}

function id() {
    return `c_${Math.random().toString(16).slice(2)}_${now()}`;
}

function toStr(v: unknown): string {
    return typeof v === "string" ? v.trim() : "";
}

function safeText(value: string, max: number): string {
    return value.replace(/[\u0000-\u001F\u007F]/g, "").slice(0, max).trim();
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
    const customerEmail = safeText(toStr(input.customer?.email), MAX_TEXT);

    const deviceName = safeText(toStr(input.device?.name), MAX_TEXT) || "未命名設備";
    const deviceModel = safeText(toStr(input.device?.model), MAX_TEXT);
    const repairReason = safeText(toStr(input.repairReason), MAX_DETAIL);
    const repairSuggestion = safeText(toStr(input.repairSuggestion), MAX_DETAIL);
    const note = safeText(toStr(input.note), MAX_DETAIL);
    const repairAmount = parseMoney(input.repairAmount);
    const inspectionFee = parseMoney(input.inspectionFee);
    const quoteStatus = parseQuoteStatus(input.quoteStatus);
    const pendingFee = computePendingFee(repairAmount, inspectionFee);

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
    const customerEmail = safeText(payload.customerEmail, MAX_TEXT).toLowerCase();
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

async function getFirestoreDb() {
    try {
        const mod = await import("@/lib/firebase-server");
        return mod.fbAdminDb;
    } catch {
        return null;
    }
}

function listFromMemory(): Ticket[] {
    return [...memory.tickets].sort((a, b) => b.createdAt - a.createdAt);
}

async function listFromFirebase(): Promise<Ticket[] | null> {
    const db = await getFirestoreDb();
    if (!db) return null;

    const snap = await db.collection("cases").orderBy("createdAt", "desc").limit(200).get();
    return snap.docs.map((doc) => normalizeTicket({ id: doc.id, ...(doc.data() as Partial<Ticket>) }));
}

async function createInMemory(params: {
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
}): Promise<Ticket> {
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
        createdAt: ts,
        updatedAt: ts,
    };
    memory.tickets = [ticket, ...memory.tickets];
    return ticket;
}

async function createInFirebase(params: {
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
}): Promise<Ticket | null> {
    const db = await getFirestoreDb();
    if (!db) return null;

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
        createdAt: ts,
        updatedAt: ts,
    };

    await db.collection("cases").doc(docId).set(ticket, { merge: false });
    return ticket;
}

async function deleteInMemory(ticketId: string): Promise<boolean> {
    const next = memory.tickets.filter((t) => t.id !== ticketId);
    const removed = next.length !== memory.tickets.length;
    memory.tickets = next;
    return removed;
}

async function deleteInFirebase(ticketId: string): Promise<boolean | null> {
    const db = await getFirestoreDb();
    if (!db) return null;

    const ref = db.collection("cases").doc(ticketId);
    const snap = await ref.get();
    if (!snap.exists) return false;
    await ref.delete();
    return true;
}

async function updateInMemory(params: {
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
}): Promise<Ticket | null> {
    const target = memory.tickets.find((t) => t.id === params.id);
    if (!target) return null;

    const nextStatus = params.status ?? target.status;
    if (!canTransition(target.status, nextStatus)) return null;

    if (params.customerName && params.customerName.trim()) target.customer.name = params.customerName.trim();
    if (params.customerPhone !== undefined) target.customer.phone = params.customerPhone;
    if (params.customerAddress !== undefined) target.customer.address = params.customerAddress;
    if (params.customerEmail !== undefined) target.customer.email = params.customerEmail;
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
    return target;
}

async function updateInFirebase(params: {
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
}): Promise<Ticket | null> {
    const db = await getFirestoreDb();
    if (!db) return null;

    const ref = db.collection("cases").doc(params.id);
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
            email: params.customerEmail !== undefined ? params.customerEmail : current.customer.email,
        },
        device: {
            name: params.deviceName && params.deviceName.trim() ? params.deviceName.trim() : current.device.name,
            model: params.deviceModel !== undefined ? params.deviceModel : current.device.model,
        },
        repairReason: params.repairReason !== undefined ? params.repairReason : current.repairReason,
        repairSuggestion:
            params.repairSuggestion !== undefined ? params.repairSuggestion : current.repairSuggestion,
        note: params.note !== undefined ? params.note : current.note,
        repairAmount: params.repairAmount !== undefined ? params.repairAmount : current.repairAmount,
        inspectionFee: params.inspectionFee !== undefined ? params.inspectionFee : current.inspectionFee,
        quoteStatus: params.quoteStatus !== undefined ? params.quoteStatus : current.quoteStatus,
        status: nextStatus,
        updatedAt: now(),
    };

    next.title = composeTitle(next.customer.name, next.device.name);
    next.pendingFee = computePendingFee(next.repairAmount, next.inspectionFee);
    await ref.set(next, { merge: true });
    return next;
}

function filterTickets(tickets: Ticket[], keyword?: string): Ticket[] {
    const q = safeText(keyword ?? "", MAX_QUERY).toLowerCase();
    if (!q) return tickets;
    return tickets.filter((t) => {
        const haystack = [
            t.id,
            t.title,
            t.customer.name,
            t.customer.phone,
            t.customer.address,
            t.customer.email,
            t.device.name,
            t.device.model,
            t.repairReason,
            t.repairSuggestion,
            t.note,
            String(t.repairAmount),
            String(t.inspectionFee),
            String(t.pendingFee),
            t.quoteStatus,
        ]
            .join(" ")
            .toLowerCase();
        return haystack.includes(q);
    });
}

export async function listTickets(): Promise<Ticket[]> {
    try {
        const firebaseTickets = await listFromFirebase();
        if (firebaseTickets) return firebaseTickets;
    } catch {
        // fallback to memory
    }
    return listFromMemory();
}

export async function queryTickets(keyword?: string): Promise<Ticket[]> {
    const tickets = await listTickets();
    return filterTickets(tickets, keyword);
}

export async function createTicket(formData: FormData): Promise<void> {
    "use server";

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
        const created = await createInFirebase(validated);
        if (!created) await createInMemory(validated);
    } catch {
        await createInMemory(validated);
    }

    revalidatePath("/ticket");
    redirect(`/ticket?flash=created&ts=${Date.now()}`);
}

export async function deleteTicket(formData: FormData): Promise<void> {
    "use server";

    const rawId = toStr(formData.get("id"));
    const ticketId = safeText(rawId, 80);
    if (!ticketId) {
        redirect(`/ticket?flash=invalid&ts=${Date.now()}`);
    }

    try {
        const removed = await deleteInFirebase(ticketId);
        if (removed === null) await deleteInMemory(ticketId);
    } catch {
        await deleteInMemory(ticketId);
    }

    revalidatePath("/ticket");
    redirect(`/ticket?flash=deleted&ts=${Date.now()}`);
}

export async function updateTicket(formData: FormData): Promise<void> {
    "use server";

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
        customerEmail: getOptional("customerEmail", MAX_TEXT)?.toLowerCase(),
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
        const updated = await updateInFirebase(payload);
        if (!updated) await updateInMemory(payload);
    } catch {
        await updateInMemory(payload);
    }

    revalidatePath("/ticket");
    redirect(`/ticket?flash=updated&ts=${Date.now()}`);
}

export async function checkTicketFirebaseConnection(): Promise<{ ok: boolean; detail: string }> {
    try {
        const db = await getFirestoreDb();
        if (!db) return { ok: false, detail: "Firebase Admin not available" };
        const snap = await db.collection("cases").limit(1).get();
        return { ok: true, detail: `Connected. Read ${snap.size} doc(s) from cases.` };
    } catch (error: unknown) {
        const detail = error instanceof Error ? error.message : "Unknown error";
        return { ok: false, detail };
    }
}
