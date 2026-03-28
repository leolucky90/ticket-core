import { NextResponse } from "next/server";
import { fbAdminAuth } from "@/lib/firebase-server";
import { fbAdminDb } from "@/lib/firebase-server";
import { ensureUserDoc } from "@/lib/services/user.service";
import { getShowcaseTenantId, getUserDoc, toAccountType } from "@/lib/services/user.service";
import { normalizeTenantId } from "@/lib/tenant-scope";

type RegisterProfileBody = {
    idToken?: string;
    accountType?: "customer" | "company";
    tenantId?: string;
};

type CompanyDoc = {
    id: string;
    name: string;
    slug: string;
    subdomain: string;
    createdAt: number;
    updatedAt: number;
    ownerUid?: string;
    ownerEmail?: string;
};

type CompanyCustomerDoc = {
    id: string;
    companyId: string;
    userUid: string;
    email: string;
    emailLower: string;
    name: string;
    createdAt: number;
    updatedAt: number;
};

function normalizeEmail(value: unknown): string {
    if (typeof value !== "string") return "";
    return value.trim().toLowerCase();
}

function toSafeSlug(text: string): string {
    return text
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60);
}

function toDisplayNameByEmail(email: string, fallback: string): string {
    const left = email.split("@")[0]?.trim();
    if (!left) return fallback;
    return left.slice(0, 48);
}

async function ensureCompanyDoc(params: { companyId: string; ownerUid?: string; ownerEmail?: string }): Promise<void> {
    const companyId = normalizeTenantId(params.companyId);
    if (!companyId) return;
    const ts = Date.now();
    const ownerEmail = normalizeEmail(params.ownerEmail ?? "");
    const name = toDisplayNameByEmail(ownerEmail, companyId);
    const slug = toSafeSlug(companyId) || `company-${companyId.slice(0, 8).toLowerCase()}`;
    const doc: CompanyDoc = {
        id: companyId,
        name,
        slug,
        subdomain: slug,
        createdAt: ts,
        updatedAt: ts,
        ownerUid: params.ownerUid,
        ownerEmail,
    };
    await fbAdminDb.collection("companies").doc(companyId).set(doc, { merge: true });
}

async function upsertCompanyCustomer(params: {
    companyId: string;
    customerUid: string;
    customerEmail: string;
}): Promise<string> {
    const companyId = normalizeTenantId(params.companyId);
    if (!companyId) throw new Error("Missing companyId");
    const customerId = params.customerUid.trim();
    if (!customerId) throw new Error("Missing customer uid");

    const ref = fbAdminDb.doc(`companies/${companyId}/customers/${customerId}`);
    const snap = await ref.get();
    const existing = (snap.data() ?? {}) as Partial<CompanyCustomerDoc>;
    const now = Date.now();
    const email = normalizeEmail(params.customerEmail);
    const name = toDisplayNameByEmail(email, `customer-${customerId.slice(0, 6)}`);
    const doc: CompanyCustomerDoc = {
        id: customerId,
        companyId,
        userUid: customerId,
        email,
        emailLower: email,
        name,
        createdAt: typeof existing.createdAt === "number" ? existing.createdAt : now,
        updatedAt: now,
    };
    await ref.set(doc, { merge: true });
    return customerId;
}

export async function POST(req: Request) {
    try {
        const body = (await req.json()) as RegisterProfileBody;
        const idToken = (body.idToken ?? "").trim();
        const accountType = body.accountType === "company" ? "company" : "customer";
        const tenantId = normalizeTenantId(body.tenantId);
        if (!idToken) return NextResponse.json({ error: "Missing idToken" }, { status: 400 });

        const decoded = await fbAdminAuth.verifyIdToken(idToken);
        const record = await fbAdminAuth.getUser(decoded.uid);
        const providers = (record.providerData ?? []).map((p) => p.providerId).filter(Boolean);
        const email = normalizeEmail(decoded.email ?? record.email ?? "");

        const existingUserDoc = await getUserDoc(decoded.uid);
        if (accountType === "customer" && tenantId) {
            const existingTenantId = getShowcaseTenantId(existingUserDoc, decoded.uid);
            if (
                existingUserDoc &&
                toAccountType(existingUserDoc.role) === "customer" &&
                existingTenantId &&
                existingTenantId !== tenantId
            ) {
                return NextResponse.json({ error: "CUSTOMER_TENANT_CONFLICT" }, { status: 409 });
            }
        }

        const role = accountType === "company" ? "company_admin" : "customer";
        const doc = await ensureUserDoc({
            uid: decoded.uid,
            email,
            providers,
            defaultRole: role,
        });

        if (accountType === "company") {
            const boundTenantId = tenantId ?? doc.companyId ?? decoded.uid;
            await fbAdminDb.collection("users").doc(decoded.uid).set(
                {
                    companyId: boundTenantId,
                    customerId: null,
                },
                { merge: true },
            );
            await ensureCompanyDoc({
                companyId: boundTenantId,
                ownerUid: decoded.uid,
                ownerEmail: email,
            });
            doc.companyId = boundTenantId;
            doc.customerId = null;
            return NextResponse.json({ ok: true, user: doc });
        }

        const boundTenantId = tenantId ?? doc.companyId;
        if (!boundTenantId) {
            return NextResponse.json({ error: "CUSTOMER_TENANT_REQUIRED" }, { status: 400 });
        }
        await ensureCompanyDoc({
            companyId: boundTenantId,
        });
        const customerId = await upsertCompanyCustomer({
            companyId: boundTenantId,
            customerUid: decoded.uid,
            customerEmail: email,
        });
        await fbAdminDb.collection("users").doc(decoded.uid).set(
            {
                companyId: boundTenantId,
                customerId,
            },
            { merge: true },
        );
        doc.companyId = boundTenantId;
        doc.customerId = customerId;
        return NextResponse.json({ ok: true, user: doc });
    } catch {
        return NextResponse.json({ error: "Unable to setup profile" }, { status: 400 });
    }
}
