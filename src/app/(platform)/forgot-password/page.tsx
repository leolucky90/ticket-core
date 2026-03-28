import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { AuthPageShell } from "@/components/auth/ui/AuthPageShell";
import { normalizeAuthTenantId, normalizeTenantId } from "@/lib/tenant-scope";

type ForgotPasswordSearchParams = {
    tenant?: string | string[];
    authTenant?: string | string[];
};

function withAuthContext(path: string, tenantId: string | null, authTenantId: string | null): string {
    const query = new URLSearchParams();
    if (tenantId) query.set("tenant", tenantId);
    if (authTenantId) query.set("authTenant", authTenantId);
    if (query.size === 0) return path;
    return `${path}${path.includes("?") ? "&" : "?"}${query.toString()}`;
}

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<ForgotPasswordSearchParams> }) {
    const sp = await searchParams;
    const tenantId = normalizeTenantId(sp?.tenant);
    const authTenantId = normalizeAuthTenantId(sp?.authTenant);
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
                <AuthShell title="忘記密碼">
                    <ForgotPasswordForm loginHref={loginHref} authTenantId={authTenantId} />
                </AuthShell>
            </AuthPageShell>
        </div>
    );
}
