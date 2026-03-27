import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthClientBlock } from "@/components/auth/AuthClientBlock";
import { AuthPageShell } from "@/components/auth/ui/AuthPageShell";
import { getSessionUser } from "@/lib/auth-enterprise/session.server";
import { getCurrentSessionAccountContext } from "@/lib/services/staff.service";

type LoginPageSearchParams = {
  tenant?: string | string[];
  authTenant?: string | string[];
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

function withAuthContext(path: string, tenantId: string | null, authTenantId: string | null): string {
  const query = new URLSearchParams();
  if (tenantId) query.set("tenant", tenantId);
  if (authTenantId) query.set("authTenant", authTenantId);
  if (query.size === 0) return path;
  return `${path}${path.includes("?") ? "&" : "?"}${query.toString()}`;
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<LoginPageSearchParams> }) {
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
    signUp: "註冊",
    switchToSignUp: "沒有帳號？去註冊",
    switchToSignIn: "已有帳號？去登入",
    error: "發生錯誤",
    or: "或",
    verifyNeeded: "請先到信箱完成 Email 驗證後再登入。",
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
          href={tenantId ? `/${encodeURIComponent(tenantId)}` : "/"}
          className="rounded-full border border-[#ffcb2d] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-[#ffcb2d] hover:bg-[#ffcb2d] hover:text-[#191815]"
        >
          Back Home
        </Link>
      </div>
      <AuthPageShell>
        <AuthShell title="登入 / 註冊">
          <AuthClientBlock
            labels={labels}
            googleLabel="使用 Google 登入"
            tenantContextId={tenantId}
            firebaseAuthTenantId={authTenantId}
          />
          <div className="pt-1 text-center text-xs text-[rgb(var(--muted))]">
            <Link className="text-[rgb(var(--accent))] hover:underline" href={withAuthContext("/forgot-password", tenantId, authTenantId)}>
              忘記密碼？
            </Link>
          </div>
          <div className="pt-1 text-center">
            <Link
              className="inline-flex rounded-full border border-[rgb(var(--accent))] px-4 py-1.5 text-xs font-semibold text-[rgb(var(--accent))] hover:bg-[rgb(var(--accent))] hover:text-[#191815]"
              href={withAuthContext("/register/customer", tenantId, authTenantId)}
            >
              註冊一般客戶帳號
            </Link>
          </div>
          <div className="pt-1 text-center text-xs text-[rgb(var(--muted))]">
            需要公司帳號？
            <Link className="ml-1 text-[rgb(var(--accent))] hover:underline" href="/register/company">
              前往公司專用註冊
            </Link>
          </div>
        </AuthShell>
      </AuthPageShell>
    </div>
  );
}
