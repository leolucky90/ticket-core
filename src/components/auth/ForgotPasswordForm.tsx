"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { fbAuth } from "@/lib/firebase-client/client";
import { AuthButton } from "@/components/auth/ui/AuthButton";
import { AuthInput } from "@/components/auth/ui/AuthInput";

type ForgotPasswordFormProps = {
    loginHref: string;
    authTenantId?: string | null;
};

function normalizeEmail(input: string): string {
    return input.trim().toLowerCase();
}

export function ForgotPasswordForm({ loginHref, authTenantId = null }: ForgotPasswordFormProps) {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    async function onSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const normalizedEmail = normalizeEmail(email);
        if (!normalizedEmail) {
            setMessage("請先輸入 Email。");
            return;
        }
        setSubmitting(true);
        setMessage(null);
        try {
            fbAuth.tenantId = authTenantId ?? null;
            const query = new URLSearchParams();
            if (authTenantId) query.set("authTenant", authTenantId);
            const resetUrl = `${window.location.origin}/reset-password${query.size ? `?${query.toString()}` : ""}`;
            await sendPasswordResetEmail(fbAuth, normalizedEmail, {
                url: resetUrl,
                handleCodeInApp: false,
            });
            setMessage("若此 Email 已註冊，系統已寄出重設密碼連結，請檢查信箱。");
        } catch {
            setMessage("若此 Email 已註冊，系統已寄出重設密碼連結，請檢查信箱。");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <form onSubmit={onSubmit} className="auth-actions">
            <div className="auth-row">
                <AuthInput
                    placeholder="輸入註冊 Email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                />
            </div>
            <AuthButton variant="primary" type="submit" disabled={submitting}>
                {submitting ? "寄送中..." : "寄送重設連結"}
            </AuthButton>
            {message ? <div className="auth-muted text-sm">{message}</div> : null}
            <div className="text-center text-xs text-[rgb(var(--muted))]">
                <Link className="auth-link" href={loginHref}>
                    返回登入
                </Link>
            </div>
        </form>
    );
}
