"use client";

import { useEffect, useMemo, useState } from "react";
import { AuthButton } from "@/components/auth/ui/AuthButton";
import { auth, googleProvider } from "@/lib/firebase/client";
import { linkWithPopup, fetchSignInMethodsForEmail } from "firebase/auth";

export function LinkGoogleClient({
    linkedLabel,
    linkNowLabel,
}: {
    linkedLabel: string;
    linkNowLabel: string;
}) {
    const [linked, setLinked] = useState(false);

    useEffect(() => {
        const u = auth.currentUser;
        if (!u) return;
        const hasGoogle = (u.providerData ?? []).some((p) => p.providerId === "google.com");
        setLinked(hasGoogle);
    }, []);

    const disabled = useMemo(() => linked, [linked]);

    return (
        <AuthButton
            type="button"
            variant="primary"
            disabled={disabled}
            onClick={async () => {
                const u = auth.currentUser;
                if (!u) return;

                // 若 email 已有其它 sign-in method，也可用這個檢查/顯示（可擴充企業提示）
                const email = (u.email ?? "").toLowerCase();
                if (email) {
                    await fetchSignInMethodsForEmail(auth, email);
                }

                await linkWithPopup(u, googleProvider);
                setLinked(true);

                // 重新建立 session + 更新 user doc providers
                const idToken = await u.getIdToken(true);
                await fetch("/api/auth/session", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ idToken }),
                });
                await fetch("/api/auth/bootstrap", { method: "POST" });
            }}
        >
            {linked ? linkedLabel : linkNowLabel}
        </AuthButton>
    );
}