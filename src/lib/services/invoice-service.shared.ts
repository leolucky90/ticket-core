import "server-only";
import { getSessionUser } from "@/lib/auth-enterprise/session.server";
import { normalizeCompanyId } from "@/lib/tenant-scope";
import { getUserCompanyId, getUserDoc, toAccountType } from "@/lib/services/user.service";

export type InvoiceServiceScope = {
    companyId: string;
    uid: string;
    email: string;
};

export async function resolveInvoiceServiceScope(): Promise<InvoiceServiceScope | null> {
    const session = await getSessionUser();
    if (!session) return null;

    const user = await getUserDoc(session.uid);
    if (!user || toAccountType(user.role) !== "company") return null;

    const companyId = normalizeCompanyId(getUserCompanyId(user, session.uid));
    if (!companyId) return null;

    return {
        companyId,
        uid: session.uid,
        email: session.email,
    };
}

export async function getInvoiceDb() {
    try {
        const { fbAdminDb } = await import("@/lib/firebase-server");
        return fbAdminDb;
    } catch {
        return null;
    }
}

export function createInvoiceEntityId(prefix: string): string {
    return `${prefix}_${Math.random().toString(16).slice(2, 10)}_${Date.now().toString(36)}`;
}
