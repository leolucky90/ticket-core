"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import {
    firebaseClientReady,
    getFirebaseClientAuth,
    getFirebaseClientErrorMessage,
} from "@/lib/firebase-client/client";
import { useUiLanguage } from "@/components/layout/ui-language-provider";
import { AuthButton } from "@/components/auth/ui/AuthButton";
import { AuthInput } from "@/components/auth/ui/AuthInput";
import { ProcessingIndicator } from "@/components/ui/processing-indicator";
import { getUiText } from "@/lib/i18n/ui-text";

type ResetPasswordFormProps = {
    loginHref: string;
    oobCode?: string | null;
    authTenantId?: string | null;
};

function evaluatePassword(password: string) {
    const hasCase = /[a-z]/.test(password) && /[A-Z]/.test(password);
    const hasLength = password.length >= 8;
    return {
        hasCase,
        hasLength,
        valid: hasCase && hasLength,
    };
}

export function ResetPasswordForm({ loginHref, oobCode = null, authTenantId = null }: ResetPasswordFormProps) {
    const lang = useUiLanguage();
    const ui = getUiText(lang).authForms;
    const pageUi = getUiText(lang).authPages;
    const [code, setCode] = useState((oobCode ?? "").trim());
    const [email, setEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [checkingCode, setCheckingCode] = useState(true);
    const [verifiedCode, setVerifiedCode] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (code) return;
        const sp = new URLSearchParams(window.location.search);
        setCode((sp.get("oobCode") ?? "").trim());
    }, [code]);

    useEffect(() => {
        async function runVerify() {
            if (!firebaseClientReady) {
                setCheckingCode(false);
                setVerifiedCode(false);
                setMessage(getFirebaseClientErrorMessage(null));
                return;
            }
            if (!code) {
                setCheckingCode(false);
                setVerifiedCode(false);
                setMessage(ui.resetMissingCode);
                return;
            }
            setCheckingCode(true);
            setMessage(null);
            try {
                const fbAuth = getFirebaseClientAuth();
                fbAuth.tenantId = authTenantId ?? null;
                const targetEmail = await verifyPasswordResetCode(fbAuth, code);
                setEmail(targetEmail);
                setVerifiedCode(true);
            } catch {
                setVerifiedCode(false);
                setMessage(ui.resetInvalidCode);
            } finally {
                setCheckingCode(false);
            }
        }
        runVerify().catch(() => {
            setCheckingCode(false);
            setVerifiedCode(false);
            setMessage(ui.resetFlowError);
        });
    }, [authTenantId, code, ui.resetFlowError, ui.resetInvalidCode, ui.resetMissingCode]);

    const passwordState = useMemo(() => evaluatePassword(newPassword), [newPassword]);
    const confirmMatched = confirmPassword.length > 0 && confirmPassword === newPassword;

    async function onSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!verifiedCode || !code) return;
        if (!firebaseClientReady) {
            setMessage(getFirebaseClientErrorMessage(null));
            return;
        }
        if (!passwordState.valid) {
            setMessage(pageUi.loginLabels.passwordPolicyError);
            return;
        }
        if (!confirmMatched) {
            setMessage(pageUi.loginLabels.passwordMismatch);
            return;
        }

        setSubmitting(true);
        setMessage(null);
        try {
            const fbAuth = getFirebaseClientAuth();
            fbAuth.tenantId = authTenantId ?? null;
            await confirmPasswordReset(fbAuth, code, newPassword);
            setSuccess(true);
            setMessage(ui.resetSuccess);
        } catch (error) {
            setSuccess(false);
            setMessage(firebaseClientReady ? ui.resetFailure : getFirebaseClientErrorMessage(error));
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="auth-actions">
            {checkingCode ? (
                <div className="auth-muted text-sm">
                    <ProcessingIndicator label={ui.resetChecking} size="sm" labelClassName="auth-muted text-sm" />
                </div>
            ) : null}
            {!checkingCode && message ? <div className="auth-muted text-sm">{message}</div> : null}
            {!checkingCode && verifiedCode ? (
                <form onSubmit={onSubmit} className="auth-actions">
                    <div className="auth-row">
                        <AuthInput value={email} disabled />
                        <AuthInput
                            placeholder={ui.resetPasswordPlaceholder}
                            type="password"
                            autoComplete="new-password"
                            value={newPassword}
                            onChange={(event) => setNewPassword(event.target.value)}
                        />
                        <AuthInput
                            placeholder={ui.resetConfirmPasswordPlaceholder}
                            type="password"
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                        />
                        <div className="auth-password-rules">
                            <div className={`auth-password-rule ${passwordState.hasCase ? "ok" : "err"}`}>{pageUi.loginLabels.passwordRuleCase}</div>
                            <div className={`auth-password-rule ${passwordState.hasLength ? "ok" : "err"}`}>{pageUi.loginLabels.passwordRuleLength}</div>
                            <div className={`auth-password-confirm ${confirmPassword.length === 0 ? "neutral" : confirmMatched ? "ok" : "err"}`}>
                                {confirmPassword.length === 0 ? "" : confirmMatched ? pageUi.loginLabels.passwordMatch : pageUi.loginLabels.passwordMismatch}
                            </div>
                        </div>
                    </div>
                    <AuthButton
                        variant="primary"
                        type="submit"
                        disabled={submitting || success || !firebaseClientReady}
                        loading={submitting}
                        loadingLabel={ui.resetSubmitting}
                    >
                        {ui.resetSubmit}
                    </AuthButton>
                </form>
            ) : null}
            <div className="text-center text-xs text-[rgb(var(--muted))]">
                <Link className="auth-link" href={loginHref}>
                    {ui.resetBackLogin}
                </Link>
            </div>
        </div>
    );
}
