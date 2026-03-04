import { AuthPageShell } from "@/components/auth/ui/AuthPageShell";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthClientBlock } from "@/components/auth/AuthClientBlock";

export default function HomePage() {
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
    <AuthPageShell>
      <AuthShell title="登入 / 註冊">
        <AuthClientBlock labels={labels} googleLabel="使用 Google 登入" />
      </AuthShell>
    </AuthPageShell>
  );
}