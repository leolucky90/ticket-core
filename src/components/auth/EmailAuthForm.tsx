"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { Check, Eye, EyeOff, X } from "lucide-react";
import {
    createUserWithEmailAndPassword,
    sendEmailVerification,
    signInWithEmailAndPassword,
    signOut,
} from "firebase/auth";
import { getFirebaseClientAuth, getFirebaseClientErrorMessage } from "@/lib/firebase-client/client";
import { AuthButton } from "@/components/auth/ui/AuthButton";
import { AuthDivider } from "@/components/auth/ui/AuthDivider";
import { AuthInput } from "@/components/auth/ui/AuthInput";
import { ProcessingIndicator } from "@/components/ui/processing-indicator";

type Mode = "signIn" | "signUp";
type SignUpAccountType = "customer" | "company";

type Labels = {
    email: string;
    password: string;
    signIn: string;
    signUp: string;
    switchToSignUp: string;
    switchToSignIn: string;
    error: string;
    or: string;
    verifyNeeded: string;
    resendVerify: string;
    verifySent: string;
    confirmPassword?: string;
    passwordRuleCase?: string;
    passwordRuleLength?: string;
    passwordMismatch?: string;
    passwordMatch?: string;
    passwordStrength?: string;
    strengthWeak?: string;
    strengthMedium?: string;
    strengthStrong?: string;
    showPassword?: string;
    hidePassword?: string;
    passwordPolicyError?: string;
};

const TENANT_SIGNIN_ERROR_CODES = new Set([
    "auth/invalid-tenant-id",
    "auth/tenant-id-mismatch",
    "auth/tenant-not-found",
]);

function getPasswordStrength(password: string): "weak" | "medium" | "strong" {
    if (!password) return "weak";

    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password) || /[^a-zA-Z\d]/.test(password)) score += 1;

    if (score <= 1) return "weak";
    if (score === 2) return "medium";
    return "strong";
}

function getAuthErrorCode(error: unknown): string {
    if (typeof error === "object" && error !== null && "code" in error) {
        const code = (error as { code?: unknown }).code;
        if (typeof code === "string") return code;
    }
    if (error instanceof Error && typeof error.message === "string" && error.message.startsWith("server/")) {
        return error.message;
    }
    return "";
}

function getAuthErrorMessage(code: string, mode: Mode, labels: Labels): string {
    if (code === "server/EMAIL_NOT_VERIFIED") return labels.verifyNeeded;
    if (code === "server/TENANT_USER_NOT_BOUND") return "此帳號尚未綁定到該商家，請改用正確商家入口登入。";
    if (code === "server/TENANT_SCOPE_MISMATCH") return "登入入口與帳號綁定商家不一致，請使用正確商家網址。";
    if (code === "server/TENANT_LOGIN_FORBIDDEN") return "此帳號是商家管理帳號，請從一般後台登入。";
    if (code === "server/CUSTOMER_TENANT_CONFLICT") return "此客戶帳號已綁定其他商家，請從原商家入口登入。";
    if (code === "server/CUSTOMER_TENANT_REQUIRED") return "客戶帳號需要商家入口才能登入。";
    if (code === "server/STAFF_ACCOUNT_NOT_ACTIVATED") return "帳號尚未啟用，請聯絡管理員。";
    if (code === "server/STAFF_ACCOUNT_INACTIVE") return "帳號已停用，請聯絡管理員。";
    if (code === "server/STAFF_ACCOUNT_LOCKED") return "帳號已被鎖定，請聯絡管理員。";
    if (code === "server/STAFF_ACCOUNT_DELETED") return "帳號已刪除，無法登入。";
    if (code === "server/STAFF_GOOGLE_NOT_LINKED") return "此帳號尚未綁定 Google，請先使用 Email 登入後至帳號安全頁綁定。";
    if (code === "server/STAFF_GOOGLE_EMAIL_MISMATCH") return "Google 信箱與員工主信箱不一致，不可登入。";
    if (code === "server/REGISTER_PROFILE_FAILED") return "建立帳號資料失敗，請稍後重試。";
    if (code === "server/SESSION_CREATE_FAILED") return "登入工作階段建立失敗，請稍後重試。";

    if (mode === "signIn") {
        if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
            return "帳號或密碼錯誤，若你是用 Google 建立帳號請改用 Google 登入。";
        }
        if (code === "auth/user-disabled") return "此帳號已被停用，請聯絡管理員。";
        if (code === "auth/too-many-requests") return "嘗試次數過多，請稍後再試。";
        if (code === "auth/network-request-failed") return "網路連線異常，請檢查網路後再試。";
        if (code === "auth/operation-not-allowed") return "此登入方式目前未開啟，請聯絡管理員。";
        if (TENANT_SIGNIN_ERROR_CODES.has(code)) return "租戶登入設定異常，請改用一般登入入口。";
    }

    if (mode === "signUp") {
        if (code === "auth/email-already-in-use") return "此 Email 已被註冊，請直接登入。";
        if (code === "auth/invalid-email") return "Email 格式不正確。";
        if (code === "auth/weak-password") return labels.passwordPolicyError ?? "密碼強度不足。";
        if (TENANT_SIGNIN_ERROR_CODES.has(code)) return "租戶註冊設定異常，請改用一般註冊入口。";
    }

    if (code) return `${labels.error} (${code})`;
    return labels.error;
}

export function EmailAuthForm({
    labels,
    onAuthed,
    initialMode = "signIn",
    showModeSwitch = true,
    signUpAccountType = "customer",
    signUpTenantId = null,
    firebaseAuthTenantId = null,
    disabled = false,
}: {
    labels: Labels;
    onAuthed: (idToken: string) => Promise<void>;
    initialMode?: Mode;
    showModeSwitch?: boolean;
    signUpAccountType?: SignUpAccountType;
    signUpTenantId?: string | null;
    firebaseAuthTenantId?: string | null;
    disabled?: boolean;
}) {
    const [mode, setMode] = useState<Mode>(initialMode);
    const [email, setEmail] = useState("");
    const [pw, setPw] = useState("");
    const [confirmPw, setConfirmPw] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        setMode(initialMode);
    }, [initialMode]);

    useEffect(() => {
        if (mode === "signIn") {
            setConfirmPw("");
            setShowPw(false);
            setShowConfirmPw(false);
        }
    }, [mode]);

    const primaryLabel = useMemo(() => (mode === "signIn" ? labels.signIn : labels.signUp), [mode, labels]);

    const isSignUp = mode === "signUp";
    const passwordHasCase = /[a-z]/.test(pw) && /[A-Z]/.test(pw);
    const passwordHasLength = pw.length >= 8;
    const passwordValid = passwordHasCase && passwordHasLength;
    const confirmMatched = confirmPw.length > 0 && confirmPw === pw;
    const passwordStrength = getPasswordStrength(pw);

    const isSubmitDisabled =
        disabled || !email.trim() || !pw || (isSignUp ? !passwordValid || !confirmMatched : false);

    const confirmPasswordLabel = labels.confirmPassword ?? "確認密碼";
    const passwordRuleCase = labels.passwordRuleCase ?? "需包含至少 1 個大寫與 1 個小寫英文字母";
    const passwordRuleLength = labels.passwordRuleLength ?? "密碼至少 8 個字元";
    const passwordMismatch = labels.passwordMismatch ?? "密碼輸入不一樣";
    const passwordMatch = labels.passwordMatch ?? "密碼驗證符合";
    const passwordStrengthLabel = labels.passwordStrength ?? "密碼強度";
    const strengthWeak = labels.strengthWeak ?? "弱";
    const strengthMedium = labels.strengthMedium ?? "中";
    const strengthStrong = labels.strengthStrong ?? "強";
    const showPasswordLabel = labels.showPassword ?? "顯示密碼";
    const hidePasswordLabel = labels.hidePassword ?? "隱藏密碼";
    const passwordPolicyError = labels.passwordPolicyError ?? "密碼規則不符合，請檢查提示。";
    const submittingMessage = `${primaryLabel}中...`;

    function onEmailChange(e: ChangeEvent<HTMLInputElement>) {
        setEmail(e.target.value);
    }

    function onPwChange(e: ChangeEvent<HTMLInputElement>) {
        setPw(e.target.value);
    }

    function onConfirmPwChange(e: ChangeEvent<HTMLInputElement>) {
        setConfirmPw(e.target.value);
    }

    async function resendVerification() {
        try {
            const fbAuth = getFirebaseClientAuth();
            const u = fbAuth.currentUser;
            if (!u) return;
            await sendEmailVerification(u);
            setMsg(labels.verifySent);
        } catch (error) {
            setMsg(getFirebaseClientErrorMessage(error));
        }
    }

    return (
        <div className="auth-actions">
            <div className="auth-row">
                <AuthInput placeholder={labels.email} autoComplete="email" value={email} onChange={onEmailChange} disabled={submitting} />

                <div className="auth-password-field">
                    <AuthInput
                        placeholder={labels.password}
                        type={showPw ? "text" : "password"}
                        autoComplete={mode === "signUp" ? "new-password" : "current-password"}
                        value={pw}
                        onChange={onPwChange}
                        disabled={submitting}
                        className="auth-password-input"
                    />
                    <button
                        type="button"
                        className="auth-password-toggle"
                        aria-label={showPw ? hidePasswordLabel : showPasswordLabel}
                        disabled={submitting}
                        onClick={() => setShowPw((value) => !value)}
                    >
                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>

                {isSignUp ? (
                    <>
                        <div className="auth-password-rules">
                            <div className={`auth-password-rule ${passwordHasCase ? "ok" : "err"}`}>
                                {passwordHasCase ? <Check size={14} /> : <X size={14} />}
                                <span>{passwordRuleCase}</span>
                            </div>
                            <div className={`auth-password-rule ${passwordHasLength ? "ok" : "err"}`}>
                                {passwordHasLength ? <Check size={14} /> : <X size={14} />}
                                <span>{passwordRuleLength}</span>
                            </div>
                            <div className={`auth-password-strength ${passwordStrength}`}>
                                {passwordStrengthLabel}：
                                {passwordStrength === "strong"
                                    ? strengthStrong
                                    : passwordStrength === "medium"
                                      ? strengthMedium
                                      : strengthWeak}
                            </div>
                        </div>

                        <div className="auth-password-field">
                            <AuthInput
                                placeholder={confirmPasswordLabel}
                                type={showConfirmPw ? "text" : "password"}
                                autoComplete="new-password"
                                value={confirmPw}
                                onChange={onConfirmPwChange}
                                disabled={submitting}
                                className="auth-password-input"
                            />
                            <button
                                type="button"
                                className="auth-password-toggle"
                                aria-label={showConfirmPw ? hidePasswordLabel : showPasswordLabel}
                                disabled={submitting}
                                onClick={() => setShowConfirmPw((value) => !value)}
                            >
                                {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>

                        <div className={`auth-password-confirm ${confirmPw.length === 0 ? "neutral" : confirmMatched ? "ok" : "err"}`}>
                            {confirmPw.length === 0 ? "" : confirmMatched ? passwordMatch : passwordMismatch}
                        </div>
                    </>
                ) : null}
            </div>

            <AuthButton
                variant="primary"
                type="button"
                disabled={isSubmitDisabled || submitting}
                loading={submitting}
                loadingLabel={submittingMessage}
                onClick={async () => {
                    if (submitting) return;
                    setMsg(null);
                    if (disabled) {
                        setMsg(getFirebaseClientErrorMessage(null));
                        return;
                    }
                    const fbAuth = getFirebaseClientAuth();

                    if (mode === "signUp") {
                        if (!passwordValid) {
                            setMsg(passwordPolicyError);
                            return;
                        }
                        if (!confirmMatched) {
                            setMsg(passwordMismatch);
                            return;
                        }
                    }

                    const previousTenantId = fbAuth.tenantId ?? null;
                    fbAuth.tenantId = firebaseAuthTenantId ?? null;
                    setSubmitting(true);
                    try {
                        const normalizedEmail = email.trim().toLowerCase();
                        if (mode === "signUp") {
                            const cred = await createUserWithEmailAndPassword(fbAuth, normalizedEmail, pw);
                            const signUpToken = await cred.user.getIdToken();
                            const roleResponse = await fetch("/api/auth/register-profile", {
                                method: "POST",
                                headers: { "content-type": "application/json" },
                                body: JSON.stringify({
                                    idToken: signUpToken,
                                    accountType: signUpAccountType,
                                    tenantId: signUpTenantId ?? undefined,
                                    authTenantId: firebaseAuthTenantId ?? undefined,
                                }),
                            });
                            if (!roleResponse.ok) {
                                const payload = (await roleResponse.json().catch(() => null)) as
                                    | { error?: unknown }
                                    | null;
                                const errorCode = typeof payload?.error === "string" ? payload.error : "REGISTER_PROFILE_FAILED";
                                throw new Error(`server/${errorCode}`);
                            }
                            await sendEmailVerification(cred.user);
                            await signOut(fbAuth);
                            setMsg(labels.verifyNeeded);
                            return;
                        }

                        let cred;
                        try {
                            cred = await signInWithEmailAndPassword(fbAuth, normalizedEmail, pw);
                        } catch (firstError) {
                            const firstCode = getAuthErrorCode(firstError);
                            // If tenant-scoped sign-in is misconfigured, retry once on default tenant.
                            if (firebaseAuthTenantId && TENANT_SIGNIN_ERROR_CODES.has(firstCode)) {
                                fbAuth.tenantId = null;
                                cred = await signInWithEmailAndPassword(fbAuth, normalizedEmail, pw);
                            } else {
                                throw firstError;
                            }
                        }
                        await cred.user.reload();

                        if (!cred.user.emailVerified) {
                            setMsg(labels.verifyNeeded);
                            await signOut(fbAuth);
                            return;
                        }

                        const idToken = await cred.user.getIdToken(true);
                        await onAuthed(idToken);
                    } catch (error) {
                        const code = getAuthErrorCode(error);
                        setMsg(code ? getAuthErrorMessage(code, mode, labels) : getFirebaseClientErrorMessage(error));
                    } finally {
                        setSubmitting(false);
                        fbAuth.tenantId = previousTenantId;
                    }
                }}
            >
                {primaryLabel}
            </AuthButton>

            {submitting ? (
                <div className="auth-muted text-sm">
                    <ProcessingIndicator label={submittingMessage} size="sm" labelClassName="auth-muted text-sm" />
                </div>
            ) : null}
            {msg ? <div className="auth-error">{msg}</div> : null}

            {msg === labels.verifyNeeded ? (
                <AuthButton type="button" onClick={resendVerification} disabled={submitting}>
                    {labels.resendVerify}
                </AuthButton>
            ) : null}

            <AuthDivider />
            <div className="auth-muted auth-switch">{labels.or}</div>

            {showModeSwitch ? (
                <button
                    type="button"
                    className="auth-link auth-switch"
                    disabled={submitting}
                    onClick={() => setMode((currentMode) => (currentMode === "signIn" ? "signUp" : "signIn"))}
                >
                    {mode === "signIn" ? labels.switchToSignUp : labels.switchToSignIn}
                </button>
            ) : null}
        </div>
    );
}
