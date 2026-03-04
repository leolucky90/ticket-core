"use client";

import { useEffect, useState } from "react";
import type { UserInfo } from "firebase/auth";
import { linkWithPopup, signOut } from "firebase/auth";
import { fbAuth, fbGoogleProvider } from "@/lib/firebase-client/client";
import { AuthButton } from "@/components/auth/ui/AuthButton";

export function LinkGoogleClient({
    linkedLabel,
    linkNowLabel,
}: {
    linkedLabel: string;
    linkNowLabel: string;
}) {
    const [linked, setLinked] = useState<boolean>(() => {
        const u = fbAuth.currentUser;
        if (!u) return false;
        return (u.providerData ?? []).some((p: UserInfo) => p.providerId === "google.com");
    });

    // keep linked state in sync if auth state changes
    useEffect(() => {
        const unsub = fbAuth.onAuthStateChanged((u) => {
            if (!u) {
                setLinked(false);
                return;
            }
            const hasGoogle = (u.providerData ?? []).some((p: UserInfo) => p.providerId === "google.com");
            setLinked(hasGoogle);
        });
        return () => unsub();
    }, []);

    const disabled = linked; // same as useMemo for simple value

    return (
        <AuthButton
            type="button"
            variant="primary"
            disabled={disabled}
            onClick={async () => {
                const u = fbAuth.currentUser;
                if (!u) return;

                if (u.email && !u.emailVerified) {
                    await signOut(fbAuth);
                    return;
                }

                await linkWithPopup(u, fbGoogleProvider);
                setLinked(true);

                const idToken = await u.getIdToken(true);
                await fetch("/api/auth/session", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ idToken }),
                });
                await fetch("/api/auth/bootstrap", { method: "POST" });
            }}
        >
            {linked ? linkedLabel : linkNowLabel}
        </AuthButton>
    );
}