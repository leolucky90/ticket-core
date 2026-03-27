"use client";

import { useState } from "react";
import { linkWithPopup, unlink } from "firebase/auth";
import { fbAuth, fbGoogleProvider } from "@/lib/firebase-client/client";
import { Button } from "@/components/ui/button";

type StaffGoogleBindingClientProps = {
    staffId: string;
    primaryEmail: string;
    linked: boolean;
    googleEmail?: string;
};

async function postJson(url: string, payload: Record<string, unknown>) {
    const response = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
    });
    const data = (await response.json().catch(() => null)) as { error?: string; message?: string } | null;
    if (!response.ok) {
        throw new Error(data?.error || data?.message || "Request failed");
    }
    return data;
}

export function StaffGoogleBindingClient({ staffId, primaryEmail, linked, googleEmail }: StaffGoogleBindingClientProps) {
    const [busy, setBusy] = useState(false);
    const [isLinked, setIsLinked] = useState(linked);
    const [boundEmail, setBoundEmail] = useState(googleEmail ?? "");
    const [message, setMessage] = useState("");

    return (
        <div className="grid gap-2">
            <div className="text-sm text-[rgb(var(--muted))]">
                狀態：{isLinked ? "已綁定" : "未綁定"} {boundEmail ? `(${boundEmail})` : ""}
            </div>
            <div className="flex flex-wrap gap-2">
                <Button
                    type="button"
                    disabled={busy || isLinked}
                    onClick={async () => {
                        setBusy(true);
                        setMessage("");
                        try {
                            const currentUser = fbAuth.currentUser;
                            if (!currentUser) throw new Error("請先以 email/password 登入後再綁定");
                            if (!currentUser.email || currentUser.email.toLowerCase() !== primaryEmail.toLowerCase()) {
                                throw new Error("Google 信箱必須與員工主信箱一致");
                            }
                            const result = await linkWithPopup(currentUser, fbGoogleProvider);
                            const credentialUser = result.user;
                            const provider = credentialUser.providerData.find((item) => item.providerId === "google.com");
                            const linkedEmail = provider?.email?.toLowerCase() || credentialUser.email?.toLowerCase();
                            if (!linkedEmail || linkedEmail !== primaryEmail.toLowerCase()) {
                                throw new Error("Google 信箱與員工主信箱不一致，不可綁定");
                            }
                            const idToken = await credentialUser.getIdToken(true);
                            await postJson("/api/account/security/google-link", {
                                idToken,
                                staffId,
                                googleEmail: linkedEmail,
                                googleUid: provider?.uid || credentialUser.uid,
                            });
                            setIsLinked(true);
                            setBoundEmail(linkedEmail);
                            setMessage("Google 帳號綁定完成");
                        } catch (error) {
                            setMessage(error instanceof Error ? error.message : "Google 綁定失敗");
                        } finally {
                            setBusy(false);
                        }
                    }}
                >
                    {busy ? "處理中..." : "綁定 Google 帳號"}
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    disabled={busy || !isLinked}
                    onClick={async () => {
                        setBusy(true);
                        setMessage("");
                        try {
                            const currentUser = fbAuth.currentUser;
                            if (currentUser) {
                                const hasGoogle = currentUser.providerData.some((item) => item.providerId === "google.com");
                                if (hasGoogle) {
                                    await unlink(currentUser, "google.com");
                                }
                            }
                            await postJson("/api/account/security/google-unlink", { staffId });
                            setIsLinked(false);
                            setBoundEmail("");
                            setMessage("Google 綁定已解除");
                        } catch (error) {
                            setMessage(error instanceof Error ? error.message : "解除綁定失敗");
                        } finally {
                            setBusy(false);
                        }
                    }}
                >
                    {busy ? "處理中..." : "解除 Google 綁定"}
                </Button>
            </div>
            {message ? <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-3 py-2 text-sm">{message}</div> : null}
        </div>
    );
}

