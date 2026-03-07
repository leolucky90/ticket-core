"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { EmailAuthForm } from "@/components/auth/EmailAuthForm";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";

type Labels = Parameters<typeof EmailAuthForm>[0]["labels"];
type AuthMode = "signIn" | "signUp";
type SignUpAccountType = "customer" | "company";

export function AuthClientBlock({
    labels,
    googleLabel,
    modeOverride,
    signUpAccountType = "customer",
    showGoogle = true,
    showTicketLink = true,
}: {
    labels: Labels;
    googleLabel: string;
    modeOverride?: AuthMode;
    signUpAccountType?: SignUpAccountType;
    showGoogle?: boolean;
    showTicketLink?: boolean;
}) {
    const router = useRouter();
    const sp = useSearchParams();
    const next = sp.get("next");
    const mode = modeOverride ?? (sp.get("mode") === "signUp" ? "signUp" : "signIn");

    async function onAuthed(idToken: string) {
        const r = await fetch("/api/auth/session", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ idToken }),
        });
        if (!r.ok) return;

        let fallbackPath = "/ticket/history";
        const bootstrapResponse = await fetch("/api/auth/bootstrap", { method: "POST" });
        if (bootstrapResponse.ok) {
            const payload = (await bootstrapResponse.json().catch(() => null)) as
                | { user?: { role?: string | null } | null }
                | null;
            const role = payload?.user?.role;
            fallbackPath = role && role !== "customer" ? "/dashboard" : "/ticket/history";
        }

        router.replace(next || fallbackPath);
        router.refresh();
    }

    return (
        <div className="auth-actions">
            <EmailAuthForm
                labels={labels}
                onAuthed={onAuthed}
                initialMode={mode}
                showModeSwitch={false}
                signUpAccountType={signUpAccountType}
            />
            {showGoogle ? <GoogleAuthButton label={googleLabel} onAuthed={onAuthed} /> : null}
            {showTicketLink ? (
                <a className="auth-link auth-switch" href="/ticket">
                    前往 Ticket
                </a>
            ) : null}
        </div>
    );
}
