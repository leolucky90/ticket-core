"use client";

import { Button } from "@/components/auth/ui/AuthButton";
import { auth, googleProvider } from "@/lib/firebase-server/crud";
import { signInWithPopup } from "firebase/auth";

export function GoogleAuthButton({
    label,
    onAuthed,
}: {
    label: string;
    onAuthed: (idToken: string) => Promise<void>;
}) {
    return (
        <Button
            type="button"
            onClick={async () => {
                const cred = await signInWithPopup(auth, googleProvider);
                const idToken = await cred.user.getIdToken(true);
                await onAuthed(idToken);
            }}
        >
            {label}
        </Button>
    );
}