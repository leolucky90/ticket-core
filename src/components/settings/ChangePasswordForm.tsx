"use client";

import { FormEvent, useMemo, useState } from "react";
import { EmailAuthProvider, reauthenticateWithCredential, signInWithEmailAndPassword, updatePassword } from "firebase/auth";
import { fbAuth } from "@/lib/firebase-client/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ChangePasswordFormProps = {
    email: string;
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

export function ChangePasswordForm({ email }: ChangePasswordFormProps) {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const passwordState = useMemo(() => evaluatePassword(newPassword), [newPassword]);
    const confirmMatched = confirmNewPassword.length > 0 && confirmNewPassword === newPassword;

    async function onSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!currentPassword) {
            setMessage("請輸入目前密碼。");
            return;
        }
        if (!passwordState.valid) {
            setMessage("新密碼不符合規則（至少 8 碼，含大小寫英文字母）。");
            return;
        }
        if (!confirmMatched) {
            setMessage("確認新密碼與新密碼不一致。");
            return;
        }
        if (currentPassword === newPassword) {
            setMessage("新密碼不可與目前密碼相同。");
            return;
        }

        setSubmitting(true);
        setMessage(null);
        try {
            let targetUser = fbAuth.currentUser;
            if (!targetUser || targetUser.email?.toLowerCase() !== email.toLowerCase()) {
                const signInResult = await signInWithEmailAndPassword(fbAuth, email, currentPassword);
                targetUser = signInResult.user;
            } else {
                const credential = EmailAuthProvider.credential(email, currentPassword);
                await reauthenticateWithCredential(targetUser, credential);
            }

            await updatePassword(targetUser, newPassword);
            const idToken = await targetUser.getIdToken(true);
            await fetch("/api/auth/session", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ idToken }),
            });
            await fetch("/api/account/security/password-changed", { method: "POST" });

            setCurrentPassword("");
            setNewPassword("");
            setConfirmNewPassword("");
            setMessage("密碼已更新。");
        } catch {
            setMessage("變更密碼失敗，請確認目前密碼是否正確。");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <form onSubmit={onSubmit} className="grid gap-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] p-4">
            <div className="text-sm font-medium">變更密碼</div>
            <Input
                type="password"
                placeholder="目前密碼"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                required
            />
            <Input
                type="password"
                placeholder="新密碼"
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                required
            />
            <Input
                type="password"
                placeholder="確認新密碼"
                autoComplete="new-password"
                value={confirmNewPassword}
                onChange={(event) => setConfirmNewPassword(event.target.value)}
                required
            />
            <div className="grid gap-1 text-xs">
                <div className={passwordState.hasCase ? "text-[rgb(var(--accent))]" : "text-[rgb(var(--muted))]"}>需包含至少 1 個大寫與 1 個小寫英文字母</div>
                <div className={passwordState.hasLength ? "text-[rgb(var(--accent))]" : "text-[rgb(var(--muted))]"}>密碼至少 8 個字元</div>
                <div className={confirmNewPassword.length === 0 ? "text-[rgb(var(--muted))]" : confirmMatched ? "text-[rgb(var(--accent))]" : "text-[rgb(var(--muted))]"}>
                    {confirmNewPassword.length === 0 ? "" : confirmMatched ? "密碼驗證符合" : "密碼輸入不一樣"}
                </div>
            </div>
            {message ? (
                <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-3 py-2 text-sm text-[rgb(var(--text))]">
                    {message}
                </div>
            ) : null}
            <div>
                <Button type="submit" disabled={submitting}>
                    {submitting ? "更新中..." : "更新密碼"}
                </Button>
            </div>
        </form>
    );
}
