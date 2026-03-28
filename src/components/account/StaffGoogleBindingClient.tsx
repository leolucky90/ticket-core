"use client";

import { useState } from "react";
import { linkWithPopup, unlink } from "firebase/auth";
import {
    getFirebaseClientAuth,
    getFirebaseClientErrorMessage,
    getFirebaseGoogleProvider,
} from "@/lib/firebase-client/client";
import { Button } from "@/components/ui/button";

type StaffGoogleBindingClientProps = {
    staffId: string;
    primaryEmail: string;
    linked: boolean;
    googleEmail?: string;
    labels: {
        statusPrefix: string;
        linked: string;
        notLinked: string;
        bindAction: string;
        bindLoading: string;
        unbindAction: string;
        unbindLoading: string;
        linkSuccess: string;
        unlinkSuccess: string;
        requireEmailPassword: string;
        emailMustMatch: string;
        emailMismatch: string;
    };
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

export function StaffGoogleBindingClient({ staffId, primaryEmail, linked, googleEmail, labels }: StaffGoogleBindingClientProps) {
    const [busyAction, setBusyAction] = useState<"link" | "unlink" | null>(null);
    const [isLinked, setIsLinked] = useState(linked);
    const [boundEmail, setBoundEmail] = useState(googleEmail ?? "");
    const [message, setMessage] = useState("");

    return (
        <div className="grid gap-2">
            <div className="text-sm text-[rgb(var(--muted))]">
                {labels.statusPrefix}：{isLinked ? labels.linked : labels.notLinked} {boundEmail ? `(${boundEmail})` : ""}
            </div>
            <div className="flex flex-wrap gap-2">
                <Button
                    type="button"
                    disabled={busyAction !== null || isLinked}
                    loading={busyAction === "link"}
                    loadingLabel={labels.bindLoading}
                    onClick={async () => {
                        setBusyAction("link");
                        setMessage("");
                        try {
                            const fbAuth = getFirebaseClientAuth();
                            const fbGoogleProvider = getFirebaseGoogleProvider();
                            const currentUser = fbAuth.currentUser;
                            if (!currentUser) throw new Error(labels.requireEmailPassword);
                            if (!currentUser.email || currentUser.email.toLowerCase() !== primaryEmail.toLowerCase()) {
                                throw new Error(labels.emailMustMatch);
                            }
                            const result = await linkWithPopup(currentUser, fbGoogleProvider);
                            const credentialUser = result.user;
                            const provider = credentialUser.providerData.find((item) => item.providerId === "google.com");
                            const linkedEmail = provider?.email?.toLowerCase() || credentialUser.email?.toLowerCase();
                            if (!linkedEmail || linkedEmail !== primaryEmail.toLowerCase()) {
                                throw new Error(labels.emailMismatch);
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
                            setMessage(labels.linkSuccess);
                        } catch (error) {
                            setMessage(getFirebaseClientErrorMessage(error));
                        } finally {
                            setBusyAction(null);
                        }
                    }}
                >
                    {labels.bindAction}
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    disabled={busyAction !== null || !isLinked}
                    loading={busyAction === "unlink"}
                    loadingLabel={labels.unbindLoading}
                    onClick={async () => {
                        setBusyAction("unlink");
                        setMessage("");
                        try {
                            const fbAuth = getFirebaseClientAuth();
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
                            setMessage(labels.unlinkSuccess);
                        } catch (error) {
                            setMessage(getFirebaseClientErrorMessage(error));
                        } finally {
                            setBusyAction(null);
                        }
                    }}
                >
                    {labels.unbindAction}
                </Button>
            </div>
            {message ? <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-3 py-2 text-sm">{message}</div> : null}
        </div>
    );
}
