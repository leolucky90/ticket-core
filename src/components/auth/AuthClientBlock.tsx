"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { EmailAuthForm } from "@/components/auth/EmailAuthForm";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";

type Labels = Parameters<typeof EmailAuthForm>[0]["labels"];

export function AuthClientBlock({
    labels,
    googleLabel,
}: {
    labels: Labels;
    googleLabel: string;
}) {
    const router = useRouter();
    const sp = useSearchParams();
    const next = sp.get("next") || "/dashboard";

    async function onAuthed(idToken: string) {
        const r = await fetch("/api/auth/session", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ idToken }),
        });
        if (!r.ok) return;

        await fetch("/api/auth/bootstrap", { method: "POST" });

        router.replace(next);
        router.refresh();
    }

    return (
        <div className="auth-actions">
            <EmailAuthForm labels={labels} onAuthed={onAuthed} />
            <GoogleAuthButton label={googleLabel} onAuthed={onAuthed} />
            <a className="auth-link auth-switch" href="/ticket">
                前往 Ticket
            </a>
        </div>
    );
}