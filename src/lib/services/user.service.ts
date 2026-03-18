import "server-only";
import { fbAdminDb } from "@/lib/firebase-server";

export type UserDoc = {
    uid: string;
    email: string;
    role: "staff" | "manager" | "company_admin" | "owner" | "super_admin" | "viewer" | "customer";
    companyId: string | null;
    customerId: string | null;
    createdAt: number;
    providers: string[];
};

export type AccountType = "company" | "customer";
const USER_ROLE_SET: ReadonlySet<UserDoc["role"]> = new Set([
    "staff",
    "manager",
    "company_admin",
    "owner",
    "super_admin",
    "viewer",
    "customer",
]);

const LEGACY_ROLE_MAP: Readonly<Record<string, UserDoc["role"]>> = {
    admin: "company_admin",
    company: "company_admin",
    company_user: "company_admin",
    company_owner: "owner",
    merchant: "company_admin",
    merchant_admin: "company_admin",
    member: "customer",
    user: "customer",
};

function parseCompanyRoleHintEmailSet(): ReadonlySet<string> {
    const source = process.env.COMPANY_ROLE_HINT_EMAILS ?? "admin1@gmail.com";
    const emails = source
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .filter((item) => item.length > 0);
    return new Set(emails);
}

const COMPANY_ROLE_HINT_EMAIL_SET = parseCompanyRoleHintEmailSet();

function normalizeCompanyId(value: unknown): string | null {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

function resolveCompanyId(role: UserDoc["role"], candidate: unknown, uidFallback: string): string | null {
    const normalized = normalizeCompanyId(candidate);
    if (toAccountType(role) === "company") return normalized ?? uidFallback;
    return normalized;
}

function normalizeCustomerId(value: unknown): string | null {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

function normalizeEmail(value: unknown): string {
    if (typeof value !== "string") return "";
    return value.trim().toLowerCase();
}

function inferFallbackRoleFromShape(input: {
    role?: unknown;
    companyId?: unknown;
    customerId?: unknown;
    email?: unknown;
}, preferred: UserDoc["role"]): UserDoc["role"] {
    const email = normalizeEmail(input.email);
    if (email && COMPANY_ROLE_HINT_EMAIL_SET.has(email)) return "company_admin";

    if (typeof input.role === "string") {
        const normalized = input.role.trim().toLowerCase();
        if (normalized) {
            if (USER_ROLE_SET.has(normalized as UserDoc["role"])) {
                const explicitRole = normalized as UserDoc["role"];
                const customerId = normalizeCustomerId(input.customerId);
                const companyId = normalizeCompanyId(input.companyId);
                if (explicitRole === "customer" && !customerId && companyId) return "company_admin";
                return explicitRole;
            }
            const mapped = LEGACY_ROLE_MAP[normalized];
            if (mapped) return mapped;
        }
    }

    const customerId = normalizeCustomerId(input.customerId);
    if (customerId) return "customer";

    const companyId = normalizeCompanyId(input.companyId);
    if (companyId) return "company_admin";

    return preferred;
}

export function toAccountType(role: UserDoc["role"] | null | undefined): AccountType {
    if (!role) return "customer";
    if (role === "customer") return "customer";
    return "company";
}

export function getShowcaseTenantId(userDoc: Pick<UserDoc, "uid" | "role" | "companyId"> | null | undefined, uidFallback?: string): string | null {
    if (!userDoc) return null;
    const companyId = normalizeCompanyId(userDoc.companyId);
    if (toAccountType(userDoc.role) === "company") return companyId ?? userDoc.uid ?? uidFallback ?? null;
    return companyId ?? userDoc.uid ?? uidFallback ?? null;
}

export async function ensureUserDoc(params: {
    uid: string;
    email: string;
    providers: string[];
    defaultRole?: UserDoc["role"];
}): Promise<UserDoc> {
    const ref = fbAdminDb.collection("users").doc(params.uid);
    const snap = await ref.get();
    const fallbackRole = params.defaultRole ?? "customer";

    if (!snap.exists) {
        const role = fallbackRole;
        const doc: UserDoc = {
            uid: params.uid,
            email: params.email,
            role,
            companyId: resolveCompanyId(role, null, params.uid),
            customerId: null,
            createdAt: Date.now(),
            providers: params.providers,
        };
        await ref.set(doc, { merge: false });
        return doc;
    }

    const existing = (snap.data() ?? {}) as Partial<UserDoc>;
    const existingProviders = Array.isArray(existing.providers) ? existing.providers : [];
    const mergedProviders = Array.from(new Set([...existingProviders, ...params.providers])).filter(
        (provider): provider is string => typeof provider === "string" && provider.length > 0,
    );

    const uid = typeof existing.uid === "string" && existing.uid ? existing.uid : params.uid;
    const role = inferFallbackRoleFromShape(
        {
            role: existing.role,
            companyId: existing.companyId,
            customerId: existing.customerId,
            email: existing.email ?? params.email,
        },
        fallbackRole,
    );
    const merged: UserDoc = {
        uid,
        email: params.email || (typeof existing.email === "string" ? existing.email : ""),
        role,
        companyId: resolveCompanyId(role, existing.companyId, uid),
        customerId: normalizeCustomerId(existing.customerId),
        createdAt: typeof existing.createdAt === "number" ? existing.createdAt : Date.now(),
        providers: mergedProviders,
    };

    await ref.set(merged, { merge: true });
    return merged;
}

export async function getUserDoc(uid: string): Promise<UserDoc | null> {
    const snap = await fbAdminDb.collection("users").doc(uid).get();
    if (!snap.exists) return null;
    const raw = (snap.data() ?? {}) as Partial<UserDoc>;
    const role = inferFallbackRoleFromShape(
        {
            role: raw.role,
            companyId: raw.companyId,
            customerId: raw.customerId,
            email: raw.email,
        },
        "customer",
    );
    const next: UserDoc = {
        uid: typeof raw.uid === "string" && raw.uid ? raw.uid : uid,
        email: typeof raw.email === "string" ? raw.email : "",
        role,
        companyId: resolveCompanyId(role, raw.companyId, uid),
        customerId: normalizeCustomerId(raw.customerId),
        createdAt: typeof raw.createdAt === "number" ? raw.createdAt : 0,
        providers: Array.isArray(raw.providers)
            ? raw.providers.filter((provider): provider is string => typeof provider === "string" && provider.length > 0)
            : [],
    };
    return next;
}
