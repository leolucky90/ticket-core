"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { signInWithPopup } from "firebase/auth";
import { fbAuth, fbGoogleProvider } from "@/lib/firebase-client/client";
import { AuthButton } from "@/components/auth/ui/AuthButton";

export function GoogleAuthButton({
    label,
    onAuthed,
    firebaseAuthTenantId,
}: {
    label: string;
    onAuthed: (idToken: string) => Promise<void>;
    firebaseAuthTenantId?: string | null;
}) {
    const [submitting, setSubmitting] = useState(false);

    return (
        <AuthButton
            type="button"
            disabled={submitting}
            onClick={async () => {
                if (submitting) return;
                const previousTenantId = fbAuth.tenantId ?? null;
                fbAuth.tenantId = firebaseAuthTenantId ?? null;
                setSubmitting(true);
                try {
                    const cred = await signInWithPopup(fbAuth, fbGoogleProvider);
                    const idToken = await cred.user.getIdToken(true);
                    await onAuthed(idToken);
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
    );
}
