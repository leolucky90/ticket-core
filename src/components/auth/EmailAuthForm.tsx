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
import { fbAuth } from "@/lib/firebase-client/client";
import { AuthButton } from "@/components/auth/ui/AuthButton";
import { AuthDivider } from "@/components/auth/ui/AuthDivider";
import { AuthInput } from "@/components/auth/ui/AuthInput";

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

export function EmailAuthForm({
    labels,
    onAuthed,
    initialMode = "signIn",
    showModeSwitch = true,
    signUpAccountType = "customer",
    signUpTenantId = null,
    firebaseAuthTenantId = null,
}: {
    labels: Labels;
    onAuthed: (idToken: string) => Promise<void>;
    initialMode?: Mode;
    showModeSwitch?: boolean;
    signUpAccountType?: SignUpAccountType;
    signUpTenantId?: string | null;
    firebaseAuthTenantId?: string | null;
}) {
    const [mode, setMode] = useState<Mode>(initialMode);
    const [email, setEmail] = useState("");
    const [pw, setPw] = useState("");
    const [confirmPw, setConfirmPw] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);

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
        !email.trim() || !pw || (isSignUp ? !passwordValid || !confirmMatched : false);

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
        const u = fbAuth.currentUser;
        if (!u) return;
        await sendEmailVerification(u);
        setMsg(labels.verifySent);
    }

    return (
        <div className="auth-actions">
            <div className="auth-row">
                <AuthInput placeholder={labels.email} autoComplete="email" value={email} onChange={onEmailChange} />

                <div className="auth-password-field">
                    <AuthInput
                        placeholder={labels.password}
                        type={showPw ? "text" : "password"}
                        autoComplete={mode === "signUp" ? "new-password" : "current-password"}
                        value={pw}
                        onChange={onPwChange}
                        className="auth-password-input"
                    />
                    <button
                        type="button"
                        className="auth-password-toggle"
                        aria-label={showPw ? hidePasswordLabel : showPasswordLabel}
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
                                className="auth-password-input"
                            />
                            <button
                                type="button"
                                className="auth-password-toggle"
                                aria-label={showConfirmPw ? hidePasswordLabel : showPasswordLabel}
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
                disabled={isSubmitDisabled}
                onClick={async () => {
                    setMsg(null);

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
                    try {
                        if (mode === "signUp") {
                            const cred = await createUserWithEmailAndPassword(fbAuth, email, pw);
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
                                throw new Error("failed to setup account profile");
                            }
                            await sendEmailVerification(cred.user);
                            await signOut(fbAuth);
                            setMsg(labels.verifyNeeded);
                            return;
                        }

                        const cred = await signInWithEmailAndPassword(fbAuth, email, pw);
                        await cred.user.reload();

                        if (!cred.user.emailVerified) {
                            setMsg(labels.verifyNeeded);
                            await signOut(fbAuth);
                            return;
                        }

                        const idToken = await cred.user.getIdToken(true);
                        await onAuthed(idToken);
                    } catch {
                        setMsg(labels.error);
                    } finally {
                        fbAuth.tenantId = previousTenantId;
                    }
                }}
            >
                {primaryLabel}
            </AuthButton>

            {msg ? <div className="auth-error">{msg}</div> : null}

            {msg === labels.verifyNeeded ? (
                <AuthButton type="button" onClick={resendVerification}>
                    {labels.resendVerify}
                </AuthButton>
            ) : null}

            <AuthDivider />
            <div className="auth-muted auth-switch">{labels.or}</div>

            {showModeSwitch ? (
                <button
                    type="button"
                    className="auth-link auth-switch"
                    onClick={() => setMode((currentMode) => (currentMode === "signIn" ? "signUp" : "signIn"))}
                >
                    {mode === "signIn" ? labels.switchToSignUp : labels.switchToSignIn}
                </button>
            ) : null}
        </div>
    );
}
