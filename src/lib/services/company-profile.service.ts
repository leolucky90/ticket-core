import "server-only";
import { getSessionUser } from "@/lib/auth-enterprise/session.server";
import { companyProfileDocPath, normalizeCompanyProfile, type CompanyProfile } from "@/lib/schema";
import { getShowcaseTenantId, getUserDoc, toAccountType } from "@/lib/services/user.service";

const memory: Record<string, CompanyProfile> = {};

function toText(value: unknown, max = 240): string {
    if (typeof value !== "string") return "";
    return value.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, max);
}

function normalizeCompanyId(value: unknown): string | null {
    const text = toText(value, 120);
    if (!text) return null;
    if (/[/?#]/.test(text)) return null;
    return text;
}

async function resolveCompanyScope(): Promise<{ companyId: string; uid: string } | null> {
    const session = await getSessionUser();
    if (!session) return null;

    const user = await getUserDoc(session.uid);
    if (!user || toAccountType(user.role) !== "company") return null;

    const companyId = normalizeCompanyId(getShowcaseTenantId(user, session.uid));
    if (!companyId) return null;

    return {
        companyId,
        uid: session.uid,
    };
}

async function getDb() {
    try {
        const { fbAdminDb } = await import("@/lib/firebase-server");
        return fbAdminDb;
    } catch {
        return null;
    }
}

export async function getCompanyProfile(): Promise<CompanyProfile | null> {
    const scope = await resolveCompanyScope();
    if (!scope) return null;

    const db = await getDb();
    if (!db) {
        return memory[scope.companyId] ??
            normalizeCompanyProfile({
                companyId: scope.companyId,
                companyName: "",
                displayName: "",
                contactName: "",
                phone: "",
                email: "",
                address: "",
                country: "",
                region: "",
                postcode: "",
                taxId: "",
                abn: "",
                businessRegistrationNumber: "",
                invoiceNote: "",
                receiptNote: "",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                updatedBy: scope.uid,
            });
    }

    const ref = db.doc(companyProfileDocPath(scope.companyId));
    const snap = await ref.get();
    if (!snap.exists) {
        return normalizeCompanyProfile({
            companyId: scope.companyId,
            companyName: "",
            displayName: "",
            contactName: "",
            phone: "",
            email: "",
            address: "",
            country: "",
            region: "",
            postcode: "",
            taxId: "",
            abn: "",
            businessRegistrationNumber: "",
            invoiceNote: "",
            receiptNote: "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            updatedBy: scope.uid,
        });
    }

    return normalizeCompanyProfile({
        companyId: scope.companyId,
        ...(snap.data() as Partial<CompanyProfile>),
    });
}

export async function updateCompanyProfile(
    input: Partial<Omit<CompanyProfile, "companyId" | "createdAt" | "updatedAt" | "updatedBy">>,
): Promise<CompanyProfile | null> {
    const scope = await resolveCompanyScope();
    if (!scope) return null;

    const current = await getCompanyProfile();
    const next = normalizeCompanyProfile({
        ...(current ?? {
            companyId: scope.companyId,
            createdAt: new Date().toISOString(),
        }),
        ...input,
        companyId: scope.companyId,
        updatedAt: new Date().toISOString(),
        updatedBy: scope.uid,
    });

    memory[scope.companyId] = next;

    const db = await getDb();
    if (!db) return next;

    const ref = db.doc(companyProfileDocPath(scope.companyId));
    await ref.set(next, { merge: true });
    return next;
}
