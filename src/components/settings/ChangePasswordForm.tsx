"use client";

import { FormEvent, useMemo, useState } from "react";
import { EmailAuthProvider, reauthenticateWithCredential, signInWithEmailAndPassword, updatePassword } from "firebase/auth";
import { MerchantSectionCard } from "@/components/merchant/shell";
import { getFirebaseClientAuth } from "@/lib/firebase-client/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ChangePasswordFormProps = {
    email: string;
    labels: {
        title: string;
        description: string;
        currentPassword: string;
        newPassword: string;
        confirmPassword: string;
        ruleCase: string;
        ruleLength: string;
        confirmMatched: string;
        confirmMismatch: string;
        missingCurrentPassword: string;
        invalidPassword: string;
        confirmMismatchError: string;
        samePasswordError: string;
        success: string;
        failure: string;
        submit: string;
        submitting: string;
    };
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

export function ChangePasswordForm({ email, labels }: ChangePasswordFormProps) {
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
            setMessage(labels.missingCurrentPassword);
            return;
        }
        if (!passwordState.valid) {
            setMessage(labels.invalidPassword);
            return;
        }
        if (!confirmMatched) {
            setMessage(labels.confirmMismatchError);
            return;
        }
        if (currentPassword === newPassword) {
            setMessage(labels.samePasswordError);
            return;
        }

        setSubmitting(true);
        setMessage(null);
        try {
            const fbAuth = getFirebaseClientAuth();
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
            setMessage(labels.success);
        } catch {
            setMessage(labels.failure);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <form onSubmit={onSubmit}>
            <MerchantSectionCard title={labels.title} description={labels.description} bodyClassName="grid gap-3">
                <Input
                    type="password"
                    placeholder={labels.currentPassword}
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    required
                />
                <Input
                    type="password"
                    placeholder={labels.newPassword}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    required
                />
                <Input
                    type="password"
                    placeholder={labels.confirmPassword}
                    autoComplete="new-password"
                    value={confirmNewPassword}
                    onChange={(event) => setConfirmNewPassword(event.target.value)}
                    required
                />
                <div className="grid gap-1 text-xs">
                    <div className={passwordState.hasCase ? "text-[rgb(var(--accent))]" : "text-[rgb(var(--muted))]"}>{labels.ruleCase}</div>
                    <div className={passwordState.hasLength ? "text-[rgb(var(--accent))]" : "text-[rgb(var(--muted))]"}>{labels.ruleLength}</div>
                    <div className={confirmNewPassword.length === 0 ? "text-[rgb(var(--muted))]" : confirmMatched ? "text-[rgb(var(--accent))]" : "text-[rgb(var(--muted))]"}>
                        {confirmNewPassword.length === 0 ? "" : confirmMatched ? labels.confirmMatched : labels.confirmMismatch}
                    </div>
                </div>
                {message ? (
                    <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-3 py-2 text-sm text-[rgb(var(--text))]">
                        {message}
                    </div>
                ) : null}
                <div>
                    <Button type="submit" disabled={submitting} loading={submitting} loadingLabel={labels.submitting}>
                        {labels.submit}
                    </Button>
                </div>
            </MerchantSectionCard>
        </form>
    );
}
