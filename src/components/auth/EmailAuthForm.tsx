"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Divider } from "@/components/ui/Divider";
import { Input } from "@/components/ui/Input";
import { auth } from "@/lib/firebase/client";
import {
    createUserWithEmailAndPassword,
    sendEmailVerification,
    signInWithEmailAndPassword,
    signOut,
} from "firebase/auth";

type Mode = "signIn" | "signUp";

export function EmailAuthForm({
    labels,
    onAuthed,
}: {
    labels: {
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

    async function resendVerification() {
        const u = auth.currentUser;
        if (!u) return;

        await sendEmailVerification(u);
        setMsg(labels.verifySent);
    }

    return (
        <div className="auth-actions">
            <div className="auth-row">
                <Input
                    placeholder={labels.email}
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <Input
                    placeholder={labels.password}
                    type="password"
                    autoComplete={mode === "signUp" ? "new-password" : "current-password"}
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                />
            </div>

            <Button
                variant="primary"
                type="button"
                onClick={async () => {
                    setMsg(null);

                    try {
                        if (mode === "signUp") {
                            const cred = await createUserWithEmailAndPassword(auth, email, pw);

                            // ✅ 註冊後立刻寄驗證信（官方做法）
                            // https://firebase.google.com/docs/auth/web/manage-users#send_a_user_a_verification_email
                            await sendEmailVerification(cred.user);

                            // ✅ 不建立 session；直接登出避免未驗證用戶持有登入態
                            await signOut(auth);

                            setMsg(labels.verifyNeeded);
                            return;
                        }

                        // signIn
                        const cred = await signInWithEmailAndPassword(auth, email, pw);

                        // 重新抓 user 狀態（避免 stale）
                        await cred.user.reload();

                        if (!cred.user.emailVerified) {
                            setMsg(labels.verifyNeeded);
                            // 使用者仍停留在 client auth 狀態，立即登出（更安全）
                            await signOut(auth);
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
            </Button>

            {msg ? <div className="auth-error">{msg}</div> : null}

            {msg === labels.verifyNeeded ? (
                <Button type="button" onClick={resendVerification}>
                    {labels.resendVerify}
                </Button>
            ) : null}

            <Divider />
            <div className="ui-muted auth-switch">{labels.or}</div>

            <button
                type="button"
                className="ui-link auth-switch"
                onClick={() => setMode((m) => (m === "signIn" ? "signUp" : "signIn"))}
            >
                {mode === "signIn" ? labels.switchToSignUp : labels.switchToSignIn}
            </button>
        </div>
    );
}