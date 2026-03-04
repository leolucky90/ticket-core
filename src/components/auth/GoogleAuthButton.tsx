"use client";

import { signInWithPopup } from "firebase/auth";
import { fbAuth, fbGoogleProvider } from "@/lib/firebase-client/client";
import { AuthButton } from "@/components/auth/ui/AuthButton";

export function GoogleAuthButton({
    label,
    onAuthed,
}: {
    label: string;
    onAuthed: (idToken: string) => Promise<void>;
}) {
    return (
        <AuthButton
            type="button"
            onClick={async () => {
                const cred = await signInWithPopup(fbAuth, fbGoogleProvider);
                const idToken = await cred.user.getIdToken(true);
                await onAuthed(idToken);
            }}
        >
            {label}
        </AuthButton>
    );
}