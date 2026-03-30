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
import { useUiLanguage } from "@/components/layout/ui-language-provider";
import { ProcessingIndicator } from "@/components/ui/processing-indicator";
import { getUiText } from "@/lib/i18n/ui-text";

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

function getAuthErrorMessage(
    code: string,
    mode: Mode,
    labels: Labels,
    ui: ReturnType<typeof getUiText>["authForms"]["emailForm"],
): string {
    if (code === "server/EMAIL_NOT_VERIFIED") return labels.verifyNeeded;
    if (code === "server/TENANT_USER_NOT_BOUND") return ui.tenantUserNotBound;
    if (code === "server/TENANT_SCOPE_MISMATCH") return ui.tenantScopeMismatch;
    if (code === "server/TENANT_LOGIN_FORBIDDEN") return ui.tenantLoginForbidden;
    if (code === "server/CUSTOMER_TENANT_CONFLICT") return ui.customerTenantConflict;
    if (code === "server/CUSTOMER_TENANT_REQUIRED") return ui.customerTenantRequired;
    if (code === "server/STAFF_ACCOUNT_NOT_ACTIVATED") return ui.staffAccountNotActivated;
    if (code === "server/STAFF_ACCOUNT_INACTIVE") return ui.staffAccountInactive;
    if (code === "server/STAFF_ACCOUNT_LOCKED") return ui.staffAccountLocked;
    if (code === "server/STAFF_ACCOUNT_DELETED") return ui.staffAccountDeleted;
    if (code === "server/STAFF_GOOGLE_NOT_LINKED") return ui.staffGoogleNotLinked;
    if (code === "server/STAFF_GOOGLE_EMAIL_MISMATCH") return ui.staffGoogleEmailMismatch;
    if (code === "server/REGISTER_PROFILE_FAILED") return ui.registerProfileFailed;
    if (code === "server/SESSION_CREATE_FAILED") return ui.sessionCreateFailed;

    if (mode === "signIn") {
        if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
            return ui.invalidCredential;
        }
        if (code === "auth/user-disabled") return ui.userDisabled;
        if (code === "auth/too-many-requests") return ui.tooManyRequests;
        if (code === "auth/network-request-failed") return ui.networkFailed;
        if (code === "auth/operation-not-allowed") return ui.operationNotAllowed;
        if (TENANT_SIGNIN_ERROR_CODES.has(code)) return ui.tenantConfigError;
    }

    if (mode === "signUp") {
        if (code === "auth/email-already-in-use") return ui.emailInUse;
        if (code === "auth/invalid-email") return ui.invalidEmail;
        if (code === "auth/weak-password") return labels.passwordPolicyError ?? ui.invalidCredential;
        if (TENANT_SIGNIN_ERROR_CODES.has(code)) return ui.tenantRegisterConfigError;
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
    const lang = useUiLanguage();
    const defaultLabels = getUiText(lang).authPages.loginLabels;
    const formUi = getUiText(lang).authForms.emailForm;
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

    const confirmPasswordLabel = labels.confirmPassword ?? defaultLabels.confirmPassword;
    const passwordRuleCase = labels.passwordRuleCase ?? defaultLabels.passwordRuleCase;
    const passwordRuleLength = labels.passwordRuleLength ?? defaultLabels.passwordRuleLength;
    const passwordMismatch = labels.passwordMismatch ?? defaultLabels.passwordMismatch;
    const passwordMatch = labels.passwordMatch ?? defaultLabels.passwordMatch;
    const passwordStrengthLabel = labels.passwordStrength ?? defaultLabels.passwordStrength;
    const strengthWeak = labels.strengthWeak ?? defaultLabels.strengthWeak;
    const strengthMedium = labels.strengthMedium ?? defaultLabels.strengthMedium;
    const strengthStrong = labels.strengthStrong ?? defaultLabels.strengthStrong;
    const showPasswordLabel = labels.showPassword ?? defaultLabels.showPassword;
    const hidePasswordLabel = labels.hidePassword ?? defaultLabels.hidePassword;
    const passwordPolicyError = labels.passwordPolicyError ?? defaultLabels.passwordPolicyError;
    const submittingMessage = `${primaryLabel}...`;

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
                        setMsg(code ? getAuthErrorMessage(code, mode, labels, formUi) : getFirebaseClientErrorMessage(error));
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
