"use client";

import { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { fbAuth, fbGoogleProvider, getFirebaseClientErrorMessage } from "@/lib/firebase-client/client";
import { AuthButton } from "@/components/auth/ui/AuthButton";

export function GoogleAuthButton({
    label,
    onAuthed,
    firebaseAuthTenantId,
    disabled = false,
}: {
    label: string;
    onAuthed: (idToken: string) => Promise<void>;
    firebaseAuthTenantId?: string | null;
    disabled?: boolean;
}) {
    const [message, setMessage] = useState<string | null>(null);

    return (
        <>
            <AuthButton
                type="button"
                disabled={disabled}
                onClick={async () => {
                    if (disabled) {
                        setMessage(getFirebaseClientErrorMessage(null));
                        return;
                    }

                    setMessage(null);
                    const previousTenantId = fbAuth.tenantId ?? null;
                    fbAuth.tenantId = firebaseAuthTenantId ?? null;
                    try {
                        const cred = await signInWithPopup(fbAuth, fbGoogleProvider);
                        const idToken = await cred.user.getIdToken(true);
                        await onAuthed(idToken);
                    } catch (error) {
                        setMessage(getFirebaseClientErrorMessage(error));
                    } finally {
                        fbAuth.tenantId = previousTenantId;
                    }
                }}
            >
                {label}
            </AuthButton>
            {message ? <div className="auth-error">{message}</div> : null}
        </>
    );
}
