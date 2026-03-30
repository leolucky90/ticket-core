"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import {
    firebaseClientReady,
    getFirebaseClientAuth,
    getFirebaseClientErrorMessage,
} from "@/lib/firebase-client/client";
import { useUiLanguage } from "@/components/layout/ui-language-provider";
import { AuthButton } from "@/components/auth/ui/AuthButton";
import { AuthInput } from "@/components/auth/ui/AuthInput";
import { getUiText } from "@/lib/i18n/ui-text";

type ForgotPasswordFormProps = {
    loginHref: string;
    authTenantId?: string | null;
};

function normalizeEmail(input: string): string {
    return input.trim().toLowerCase();
}

export function ForgotPasswordForm({ loginHref, authTenantId = null }: ForgotPasswordFormProps) {
    const lang = useUiLanguage();
    const ui = getUiText(lang).authForms;
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    async function onSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const normalizedEmail = normalizeEmail(email);
        if (!normalizedEmail) {
            setMessage(ui.forgotEmailRequired);
            return;
        }
        setSubmitting(true);
        setMessage(null);
        try {
            if (!firebaseClientReady) throw new Error(getFirebaseClientErrorMessage(null));
            const fbAuth = getFirebaseClientAuth();
            fbAuth.tenantId = authTenantId ?? null;
            const query = new URLSearchParams();
            if (authTenantId) query.set("authTenant", authTenantId);
            const resetUrl = `${window.location.origin}/reset-password${query.size ? `?${query.toString()}` : ""}`;
            await sendPasswordResetEmail(fbAuth, normalizedEmail, {
                url: resetUrl,
                handleCodeInApp: false,
            });
            setMessage(ui.forgotSuccess);
        } catch (error) {
            setMessage(firebaseClientReady ? ui.forgotSuccess : getFirebaseClientErrorMessage(error));
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <form onSubmit={onSubmit} className="auth-actions">
            <div className="auth-row">
                <AuthInput
                    placeholder={ui.forgotEmailPlaceholder}
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                />
            </div>
            <AuthButton
                variant="primary"
                type="submit"
                disabled={submitting || !firebaseClientReady}
                loading={submitting}
                loadingLabel={ui.forgotSubmitting}
            >
                {ui.forgotSubmit}
            </AuthButton>
            {message ? <div className="auth-muted text-sm">{message}</div> : null}
            <div className="text-center text-xs text-[rgb(var(--muted))]">
                <Link className="auth-link" href={loginHref}>
                    {ui.forgotBackLogin}
                </Link>
            </div>
        </form>
    );
}
