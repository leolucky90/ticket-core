"use client";

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
    return (
        <AuthButton
            type="button"
            onClick={async () => {
                const previousTenantId = fbAuth.tenantId ?? null;
                fbAuth.tenantId = firebaseAuthTenantId ?? null;
                try {
                    const cred = await signInWithPopup(fbAuth, fbGoogleProvider);
                    const idToken = await cred.user.getIdToken(true);
                    await onAuthed(idToken);
                } finally {
                    fbAuth.tenantId = previousTenantId;
                }
            }}
        >
            {label}
        </AuthButton>
    );
}
