import "server-only";
import { getSessionUser } from "@/lib/auth-enterprise/session.server";
import { getCurrentSessionAccountContext } from "@/lib/services/staff.service";
import { normalizeCompanyId } from "@/lib/tenant-scope";

export type DocumentIntakeSession = {
    uid: string;
    companyId: string;
};

export async function requireMerchantDocumentIntakeSession(): Promise<DocumentIntakeSession | null> {
    const session = await getSessionUser();
    if (!session) return null;

    const ctx = await getCurrentSessionAccountContext();
    if (!ctx || ctx.accountType !== "company") return null;
    const tenantId = ctx.tenantId;
    if (!tenantId) return null;

    const companyId = normalizeCompanyId(tenantId);
    if (!companyId) return null;

    return {
        uid: session.uid,
        companyId,
    };
}
