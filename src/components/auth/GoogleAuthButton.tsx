"use client";

import { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import {
    getFirebaseClientAuth,
    getFirebaseClientErrorMessage,
    getFirebaseGoogleProvider,
} from "@/lib/firebase-client/client";
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
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    return (
        <>
            <AuthButton
                type="button"
                disabled={disabled || submitting}
                loading={submitting}
                loadingLabel="登入中..."
                onClick={async () => {
                    if (disabled) {
                        setMessage(getFirebaseClientErrorMessage(null));
                        return;
                    }
                    if (submitting) return;

                    setMessage(null);
                    const fbAuth = getFirebaseClientAuth();
                    const fbGoogleProvider = getFirebaseGoogleProvider();
                    const previousTenantId = fbAuth.tenantId ?? null;
                    fbAuth.tenantId = firebaseAuthTenantId ?? null;
                    setSubmitting(true);
                    try {
                        const cred = await signInWithPopup(fbAuth, fbGoogleProvider);
                        const idToken = await cred.user.getIdToken(true);
                        await onAuthed(idToken);
                    } catch (error) {
                        setMessage(getFirebaseClientErrorMessage(error));
                    } finally {
                        setSubmitting(false);
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
