import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthClientBlock } from "@/components/auth/AuthClientBlock";
import { AuthPageShell } from "@/components/auth/ui/AuthPageShell";
import { getSessionUser } from "@/lib/auth-enterprise/session.server";
import { getCurrentSessionAccountContext } from "@/lib/services/staff.service";
import { normalizeAuthTenantId, normalizeTenantId } from "@/lib/tenant-scope";

type RegisterCustomerSearchParams = {
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

export default async function CustomerRegisterPage({ searchParams }: { searchParams: Promise<RegisterCustomerSearchParams> }) {
    const sp = await searchParams;
    const tenantId = normalizeTenantId(sp?.tenant);
    const authTenantId = normalizeAuthTenantId(sp?.authTenant);

    const session = await getSessionUser();
    if (session) {
        const accountContext = await getCurrentSessionAccountContext();
        if (accountContext?.accountType === "company") {
            redirect("/dashboard");
        }
        const targetTenantId = authTenantId ?? tenantId ?? accountContext?.tenantId ?? null;
        if (targetTenantId) {
            redirect(`/${encodeURIComponent(targetTenantId)}/dashboard`);
        }
        redirect("/customer-dashboard");
    }

    const labels = {
        email: "Email",
        password: "密碼",
        signIn: "登入",
        signUp: "註冊客戶帳號",
        switchToSignUp: "沒有帳號？去註冊",
        switchToSignIn: "已有帳號？去登入",
        error: "發生錯誤",
        or: "或",
        verifyNeeded: "客戶帳號建立完成，請先到信箱完成 Email 驗證後再登入。",
        resendVerify: "重寄驗證信",
        verifySent: "已送出驗證信（請檢查收件匣/垃圾郵件）。",
        confirmPassword: "確認密碼",
        passwordRuleCase: "需包含至少 1 個大寫與 1 個小寫英文字母",
        passwordRuleLength: "密碼至少 8 個字元",
        passwordMismatch: "密碼輸入不一樣",
        passwordMatch: "密碼驗證符合",
        passwordStrength: "密碼強度",
        strengthWeak: "弱",
        strengthMedium: "中",
        strengthStrong: "強",
        showPassword: "顯示密碼",
        hidePassword: "隱藏密碼",
        passwordPolicyError: "密碼規則不符合，請檢查提示。",
    };

    return (
        <div className="min-h-dvh bg-[#191815] text-[#f5f1df]">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 md:px-6">
                <Link
                    href={withAuthContext("/login", tenantId, authTenantId)}
                    className="rounded-full border border-[#ffcb2d] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-[#ffcb2d] hover:bg-[#ffcb2d] hover:text-[#191815]"
                >
                    Back Login
                </Link>
            </div>
            <AuthPageShell>
                <AuthShell title="客戶註冊">
                    <AuthClientBlock
                        labels={labels}
                        googleLabel="使用 Google 登入"
                        modeOverride="signUp"
                        signUpAccountType="customer"
                        tenantContextId={tenantId}
                        firebaseAuthTenantId={authTenantId}
                    />
                    <div className="pt-2 text-center text-xs text-[rgb(var(--muted))]">
                        <Link
                            className="text-[rgb(var(--accent))] hover:underline"
                            href={withAuthContext("/login", tenantId, authTenantId)}
                        >
                            返回登入頁面
                        </Link>
                        <span className="px-1">·</span>
                        <Link
                            className="text-[rgb(var(--accent))] hover:underline"
                            href={withAuthContext("/forgot-password", tenantId, authTenantId)}
                        >
                            忘記密碼
                        </Link>
                    </div>
                </AuthShell>
            </AuthPageShell>
        </div>
    );
}
