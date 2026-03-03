"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { EmailAuthForm } from "@/components/auth/EmailAuthForm";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";

export function AuthClientBlock({
    labels,
    googleLabel,
}: {
    labels: {
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
    };
    googleLabel: string;
}) {
    const router = useRouter();
    const sp = useSearchParams();
    const next = sp.get("next") || "/dashboard";

    async function onAuthed(idToken: string) {
        // 1) 建立 session cookie（server 會再檢查 email_verified）
        const r = await fetch("/api/auth/session", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ idToken }),
        });

        if (!r.ok) {
            // 403 EMAIL_NOT_VERIFIED 會被擋（雙重保護）
            return;
        }

        // 2) 建立/更新 user doc（providers / role）
        await fetch("/api/auth/bootstrap", { method: "POST" });

        router.replace(next);
        router.refresh();
    }

    return (
        <div className="auth-actions">
            <EmailAuthForm labels={labels} onAuthed={onAuthed} />
            <GoogleAuthButton label={googleLabel} onAuthed={onAuthed} />
        </div>
    );
}