"use client";

import { useEffect, useState } from "react";
import type { UserInfo } from "firebase/auth";
import { linkWithPopup, signOut } from "firebase/auth";
import {
    firebaseClientReady,
    getFirebaseClientAuth,
    getFirebaseClientErrorMessage,
    getFirebaseGoogleProvider,
} from "@/lib/firebase-client/client";
import { AuthButton } from "@/components/auth/ui/AuthButton";

export function LinkGoogleClient({
    linkedLabel,
    linkNowLabel,
}: {
    linkedLabel: string;
    linkNowLabel: string;
}) {
    const [linked, setLinked] = useState<boolean>(() => {
        if (!firebaseClientReady) return false;
        const fbAuth = getFirebaseClientAuth();
        const u = fbAuth.currentUser;
        if (!u) return false;
        return (u.providerData ?? []).some((p: UserInfo) => p.providerId === "google.com");
    });
    const [message, setMessage] = useState<string | null>(null);

    // keep linked state in sync if auth state changes
    useEffect(() => {
        if (!firebaseClientReady) return;
        const fbAuth = getFirebaseClientAuth();
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
        <>
            <AuthButton
                type="button"
                variant="primary"
                disabled={disabled || !firebaseClientReady}
                onClick={async () => {
                    try {
                        if (!firebaseClientReady) throw new Error(getFirebaseClientErrorMessage(null));
                        const fbAuth = getFirebaseClientAuth();
                        const fbGoogleProvider = getFirebaseGoogleProvider();
                        const u = fbAuth.currentUser;
                        if (!u) return;

                        if (u.email && !u.emailVerified) {
                            await signOut(fbAuth);
                            return;
                        }

                        await linkWithPopup(u, fbGoogleProvider);
                        setLinked(true);
                        setMessage(null);

                        const idToken = await u.getIdToken(true);
                        await fetch("/api/auth/session", {
                            method: "POST",
                            headers: { "content-type": "application/json" },
                            body: JSON.stringify({ idToken }),
                        });
                        await fetch("/api/auth/bootstrap", { method: "POST" });
                    } catch (error) {
                        setMessage(getFirebaseClientErrorMessage(error));
                    }
                }}
            >
                {linked ? linkedLabel : linkNowLabel}
            </AuthButton>
            {message ? <div className="auth-error">{message}</div> : null}
        </>
    );
}
