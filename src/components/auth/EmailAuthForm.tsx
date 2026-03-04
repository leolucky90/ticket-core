"use client";

import { useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import {
    createUserWithEmailAndPassword,
    sendEmailVerification,
    signInWithEmailAndPassword,
    signOut,
} from "firebase/auth";
import { fbAuth } from "@/lib/firebase-client/client";
import { AuthButton } from "@/components/auth/ui/AuthButton";
import { AuthDivider } from "@/components/auth/ui/AuthDivider";
import { AuthInput } from "@/components/auth/ui/AuthInput";

type Mode = "signIn" | "signUp";

type Labels = {
    email: string;
    password: string;
    signIn: string;
    signUp: string;
    switchToSignUp: string;
    switchToSignIn: string;
    error: string;
    or: string;
    verifyNeeded: string;
    resendVerify: string;
    verifySent: string;
};

export function EmailAuthForm({
    labels,
    onAuthed,
}: {
    labels: Labels;
    onAuthed: (idToken: string) => Promise<void>;
}) {
    const [mode, setMode] = useState<Mode>("signIn");
    const [email, setEmail] = useState("");
    const [pw, setPw] = useState("");
    const [msg, setMsg] = useState<string | null>(null);

    const primaryLabel = useMemo(
        () => (mode === "signIn" ? labels.signIn : labels.signUp),
        [mode, labels],
    );

    function onEmailChange(e: ChangeEvent<HTMLInputElement>) {
        setEmail(e.target.value);
    }

    function onPwChange(e: ChangeEvent<HTMLInputElement>) {
        setPw(e.target.value);
    }

    async function resendVerification() {
        const u = fbAuth.currentUser;
        if (!u) return;
        await sendEmailVerification(u);
        setMsg(labels.verifySent);
    }

    return (
        <div className="auth-actions">
            <div className="auth-row">
                <AuthInput placeholder={labels.email} autoComplete="email" value={email} onChange={onEmailChange} />
                <AuthInput
                    placeholder={labels.password}
                    type="password"
                    autoComplete={mode === "signUp" ? "new-password" : "current-password"}
                    value={pw}
                    onChange={onPwChange}
                />
            </div>

            <AuthButton
                variant="primary"
                type="button"
                onClick={async () => {
                    setMsg(null);
                    try {
                        if (mode === "signUp") {
                            const cred = await createUserWithEmailAndPassword(fbAuth, email, pw);
                            await sendEmailVerification(cred.user);
                            await signOut(fbAuth);
                            setMsg(labels.verifyNeeded);
                            return;
                        }

                        const cred = await signInWithEmailAndPassword(fbAuth, email, pw);
                        await cred.user.reload();

                        if (!cred.user.emailVerified) {
                            setMsg(labels.verifyNeeded);
                            await signOut(fbAuth);
                            return;
                        }

                        const idToken = await cred.user.getIdToken(true);
                        await onAuthed(idToken);
                    } catch {
                        setMsg(labels.error);
                    }
                }}
            >
                {primaryLabel}
            </AuthButton>

            {msg ? <div className="auth-error">{msg}</div> : null}

            {msg === labels.verifyNeeded ? (
                <AuthButton type="button" onClick={resendVerification}>
                    {labels.resendVerify}
                </AuthButton>
            ) : null}

            <AuthDivider />
            <div className="auth-muted auth-switch">{labels.or}</div>

            <button
                type="button"
                className="auth-link auth-switch"
                onClick={() => setMode((m) => (m === "signIn" ? "signUp" : "signIn"))}
            >
                {mode === "signIn" ? labels.switchToSignUp : labels.switchToSignIn}
            </button>
        </div>
    );
}