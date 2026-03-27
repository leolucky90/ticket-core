"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import {
    firebaseClientReady,
    getFirebaseClientAuth,
    getFirebaseClientErrorMessage,
} from "@/lib/firebase-client/client";
import { AuthButton } from "@/components/auth/ui/AuthButton";
import { AuthInput } from "@/components/auth/ui/AuthInput";

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
                setMessage("缺少重設代碼，請從信箱中的連結重新進入。");
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
                setMessage("重設連結無效或已過期，請重新申請忘記密碼。");
            } finally {
                setCheckingCode(false);
            }
        }
        runVerify().catch(() => {
            setCheckingCode(false);
            setVerifiedCode(false);
            setMessage("重設流程發生錯誤，請稍後再試。");
        });
    }, [authTenantId, code]);

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
            setMessage("新密碼不符合規則（至少 8 碼，含大小寫英文字母）。");
            return;
        }
        if (!confirmMatched) {
            setMessage("新密碼與確認新密碼不一致。");
            return;
        }

        setSubmitting(true);
        setMessage(null);
        try {
            const fbAuth = getFirebaseClientAuth();
            fbAuth.tenantId = authTenantId ?? null;
            await confirmPasswordReset(fbAuth, code, newPassword);
            setSuccess(true);
            setMessage("密碼已重設成功，請使用新密碼登入。");
        } catch (error) {
            setSuccess(false);
            setMessage(firebaseClientReady ? "密碼重設失敗，連結可能已過期，請重新申請。" : getFirebaseClientErrorMessage(error));
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="auth-actions">
            {checkingCode ? <div className="auth-muted text-sm">驗證重設連結中...</div> : null}
            {!checkingCode && message ? <div className="auth-muted text-sm">{message}</div> : null}
            {!checkingCode && verifiedCode ? (
                <form onSubmit={onSubmit} className="auth-actions">
                    <div className="auth-row">
                        <AuthInput value={email} disabled />
                        <AuthInput
                            placeholder="新密碼"
                            type="password"
                            autoComplete="new-password"
                            value={newPassword}
                            onChange={(event) => setNewPassword(event.target.value)}
                        />
                        <AuthInput
                            placeholder="確認新密碼"
                            type="password"
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                        />
                        <div className="auth-password-rules">
                            <div className={`auth-password-rule ${passwordState.hasCase ? "ok" : "err"}`}>需包含至少 1 個大寫與 1 個小寫英文字母</div>
                            <div className={`auth-password-rule ${passwordState.hasLength ? "ok" : "err"}`}>密碼至少 8 個字元</div>
                            <div className={`auth-password-confirm ${confirmPassword.length === 0 ? "neutral" : confirmMatched ? "ok" : "err"}`}>
                                {confirmPassword.length === 0 ? "" : confirmMatched ? "密碼驗證符合" : "密碼輸入不一樣"}
                            </div>
                        </div>
                    </div>
                    <AuthButton variant="primary" type="submit" disabled={submitting || success || !firebaseClientReady}>
                        {submitting ? "更新中..." : "更新密碼"}
                    </AuthButton>
                </form>
            ) : null}
            <div className="text-center text-xs text-[rgb(var(--muted))]">
                <Link className="auth-link" href={loginHref}>
                    返回登入
                </Link>
            </div>
        </div>
    );
}
