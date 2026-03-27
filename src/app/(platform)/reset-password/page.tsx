import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { AuthPageShell } from "@/components/auth/ui/AuthPageShell";

type ResetPasswordSearchParams = {
    tenant?: string | string[];
    authTenant?: string | string[];
    oobCode?: string | string[];
};

function normalizeTenantId(value: string | string[] | undefined): string | null {
    const raw = Array.isArray(value) ? value[0] : value;
    if (typeof raw !== "string") return null;
    const trimmed = raw.trim();
    if (!trimmed) return null;
    if (/[/?#]/.test(trimmed)) return null;
    return trimmed;
}

function normalizeAuthTenantId(value: string | string[] | undefined): string | null {
    const raw = Array.isArray(value) ? value[0] : value;
    if (typeof raw !== "string") return null;
    const trimmed = raw.trim();
    if (!trimmed) return null;
    if (!/^[a-zA-Z0-9-]+$/.test(trimmed)) return null;
    return trimmed;
}

function normalizeCode(value: string | string[] | undefined): string | null {
    const raw = Array.isArray(value) ? value[0] : value;
    if (typeof raw !== "string") return null;
    const trimmed = raw.trim();
    return trimmed || null;
}

function withAuthContext(path: string, tenantId: string | null, authTenantId: string | null): string {
    const query = new URLSearchParams();
    if (tenantId) query.set("tenant", tenantId);
    if (authTenantId) query.set("authTenant", authTenantId);
    if (query.size === 0) return path;
    return `${path}${path.includes("?") ? "&" : "?"}${query.toString()}`;
}

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<ResetPasswordSearchParams> }) {
    const sp = await searchParams;
    const tenantId = normalizeTenantId(sp?.tenant);
    const authTenantId = normalizeAuthTenantId(sp?.authTenant);
    const oobCode = normalizeCode(sp?.oobCode);
    const loginHref = withAuthContext("/login", tenantId, authTenantId);

    return (
        <div className="min-h-dvh bg-[#191815] text-[#f5f1df]">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 md:px-6">
                <Link
                    href={loginHref}
                    className="rounded-full border border-[#ffcb2d] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-[#ffcb2d] hover:bg-[#ffcb2d] hover:text-[#191815]"
                >
                    Back Login
                </Link>
            </div>
            <AuthPageShell>
                <AuthShell title="重設密碼">
                    <ResetPasswordForm loginHref={loginHref} oobCode={oobCode} authTenantId={authTenantId} />
                </AuthShell>
            </AuthPageShell>
        </div>
    );
}
