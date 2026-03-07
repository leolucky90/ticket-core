import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthClientBlock } from "@/components/auth/AuthClientBlock";
import { AuthPageShell } from "@/components/auth/ui/AuthPageShell";
import { getSessionUser } from "@/lib/auth-enterprise/session.server";
import { getUserDoc, toAccountType } from "@/lib/services/user.service";

export default async function LoginPage() {
  const session = await getSessionUser();
  if (session) {
    const userDoc = await getUserDoc(session.uid);
    const accountType = toAccountType(userDoc?.role ?? null);
    redirect(accountType === "company" ? "/dashboard" : "/ticket/history");
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
  };

  return (
    <div className="min-h-dvh bg-[#191815] text-[#f5f1df]">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 md:px-6">
        <Link
          href="/"
          className="rounded-full border border-[#ffcb2d] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-[#ffcb2d] hover:bg-[#ffcb2d] hover:text-[#191815]"
        >
          Back Home
        </Link>
      </div>
      <AuthPageShell>
        <AuthShell title="登入 / 註冊">
          <AuthClientBlock labels={labels} googleLabel="使用 Google 登入" />
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
