"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
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
                {submitting ? (
                    <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        <span>登入中...</span>
                    </span>
                ) : (
                    label
                )}
            </AuthButton>
            {message ? <div className="auth-error">{message}</div> : null}
        </>
    );
}
