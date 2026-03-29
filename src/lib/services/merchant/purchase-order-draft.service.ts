import "server-only";
import { getSessionUser } from "@/lib/auth-enterprise/session.server";
import { fbAdminDb } from "@/lib/firebase-server";
import type { PoDraft } from "@/lib/schema/ai/po-draft";
import { poDraftDocPath, poDraftsCollectionPath } from "@/lib/schema/receiptPoIntake";
import { createDoc, getDoc, queryCollectionOrdered } from "@/lib/services/db/firestore";
import { getUserCompanyId, getUserDoc, toAccountType } from "@/lib/services/user.service";
import { normalizeCompanyId } from "@/lib/tenant-scope";
import type { PurchaseOrderDraft, PurchaseOrderDraftLine } from "@/lib/types/purchase-order";

type SessionScope = {
    companyId: string;
};

function nowIso(): string {
    return new Date().toISOString();
}

function newId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
}

function timestampToIso(value: unknown): string {
    if (
        value &&
        typeof value === "object" &&
        "toDate" in value &&
        typeof (value as { toDate: () => Date }).toDate === "function"
    ) {
        return (value as { toDate: () => Date }).toDate().toISOString();
    }
    if (typeof value === "string") return value;
    return nowIso();
}

function normalizeLines(raw: unknown): PurchaseOrderDraftLine[] {
    if (!Array.isArray(raw)) return [];
    return raw
        .map((row, i) => {
            const r = row as Record<string, unknown>;
            const id = typeof r.id === "string" ? r.id : `pol_${i}`;
            const label = typeof r.label === "string" ? r.label : "";
            const qty = typeof r.qty === "number" && Number.isFinite(r.qty) ? Math.max(1, Math.round(r.qty)) : 1;
            const productId = r.productId != null ? String(r.productId) : null;
            const sku = r.sku != null ? String(r.sku) : null;
            const unitPrice =
                typeof r.unitPrice === "number" && Number.isFinite(r.unitPrice) ? r.unitPrice : null;
            const amount = typeof r.amount === "number" && Number.isFinite(r.amount) ? r.amount : null;
            return { id, label, qty, productId, sku, unitPrice, amount };
        })
        .filter((l) => l.label.length > 0);
}

function mapFirestoreToPurchaseOrderDraft(id: string, data: Record<string, unknown>): PurchaseOrderDraft {
    const companyId = typeof data.companyId === "string" ? data.companyId : "";
    const source = data.source === "manual" ? "manual" : "ai_upload";
    const status = (data.status as PurchaseOrderDraft["status"]) ?? "draft";
    const supplierLabel = typeof data.supplierLabel === "string" ? data.supplierLabel : "";
    const note = data.note === null || data.note === undefined ? null : String(data.note);
    const expectedDeliveryAt =
        data.expectedDeliveryAt === null || data.expectedDeliveryAt === undefined
            ? null
            : String(data.expectedDeliveryAt);
    const trackingHints = Array.isArray(data.trackingHints)
        ? data.trackingHints.filter((t): t is string => typeof t === "string")
        : [];
    const aiUploadFileNames = Array.isArray(data.aiUploadFileNames)
        ? data.aiUploadFileNames.filter((t): t is string => typeof t === "string")
        : [];
    const poDraftSnapshot = (data.poDraftSnapshot ?? null) as PoDraft | null | undefined;
    const documentIntakeId =
        data.documentIntakeId === null || data.documentIntakeId === undefined
            ? null
            : String(data.documentIntakeId);
    const confirmedPoId =
        data.confirmedPoId != null
            ? String(data.confirmedPoId)
            : data.poId != null
              ? String(data.poId)
              : null;

    return {
        id,
        companyId,
        source,
        status,
        supplierLabel,
        note,
        expectedDeliveryAt,
        lines: normalizeLines(data.lines),
        trackingHints,
        aiUploadFileNames,
        createdAt: timestampToIso(data.createdAt),
        updatedAt: timestampToIso(data.updatedAt),
        poDraftSnapshot: poDraftSnapshot ?? null,
        documentIntakeId,
        confirmedPoId,
    };
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

    return { companyId };
}

export async function requirePurchaseOrderScope(): Promise<SessionScope> {
    const scope = await resolveSessionScope(true);
    if (!scope) {
        throw new Error("UNAUTHORIZED");
    }
    return scope;
}

export async function listPurchaseOrderDraftsForSession(): Promise<PurchaseOrderDraft[]> {
    const scope = await resolveSessionScope(true);
    if (!scope) return [];

    const rows = await queryCollectionOrdered(
        poDraftsCollectionPath(scope.companyId),
        "createdAt",
        "desc",
        100,
    );
    return rows.map((r) => mapFirestoreToPurchaseOrderDraft(r.id, r.data as Record<string, unknown>));
}

export async function getPurchaseOrderDraftForSession(draftId: string): Promise<PurchaseOrderDraft | null> {
    const scope = await resolveSessionScope(true);
    if (!scope) return null;
    const path = poDraftDocPath(scope.companyId, draftId);
    const data = await getDoc(path);
    if (!data) return null;
    return mapFirestoreToPurchaseOrderDraft(draftId, data as Record<string, unknown>);
}

export type CreateManualPurchaseOrderInput = {
    supplierLabel: string;
    note: string | null;
    expectedDeliveryAt: string | null;
    trackingHints: string[];
    lines: Array<{ label: string; qty: number }>;
};

export async function createManualPurchaseOrderDraft(input: CreateManualPurchaseOrderInput): Promise<PurchaseOrderDraft> {
    const scope = await requirePurchaseOrderScope();
    const lines: PurchaseOrderDraftLine[] = input.lines.map((row) => ({
        id: newId("pol"),
        label: row.label,
        qty: row.qty,
    }));

    const draftId = await createDoc(poDraftsCollectionPath(scope.companyId), {
        companyId: scope.companyId,
        source: "manual",
        status: "draft",
        supplierLabel: input.supplierLabel,
        note: input.note,
        expectedDeliveryAt: input.expectedDeliveryAt,
        lines,
        trackingHints: [...input.trackingHints],
        aiUploadFileNames: [],
    });

    const written = await getDoc(poDraftDocPath(scope.companyId, draftId));
    if (!written) {
        throw new Error("Failed to read created draft");
    }
    return mapFirestoreToPurchaseOrderDraft(draftId, written as Record<string, unknown>);
}

export async function deletePurchaseOrderDraftForSession(draftId: string): Promise<void> {
    const scope = await requirePurchaseOrderScope();
    const path = poDraftDocPath(scope.companyId, draftId);
    const data = await getDoc(path);
    if (!data) {
        throw new Error("Draft not found");
    }
    if ((data as { status?: string }).status === "confirmed") {
        throw new Error("Cannot delete confirmed draft");
    }
    await fbAdminDb.doc(path).delete();
}
