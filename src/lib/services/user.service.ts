import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import type { SessionRole } from "@/lib/auth/session.server";

export type UserDoc = {
    uid: string;
    email: string;
    role: SessionRole;
    createdAt: number;
    providers: string[]; // e.g. ["password","google.com"]
};

export async function ensureUserDoc(params: {
    uid: string;
    email: string;
    providers: string[];
}): Promise<UserDoc> {
    const ref = adminDb.collection("users").doc(params.uid);
    const snap = await ref.get();

    if (!snap.exists) {
        const doc: UserDoc = {
            uid: params.uid,
            email: params.email,
            role: "staff",
            createdAt: Date.now(),
            providers: params.providers,
        };
        await ref.set(doc, { merge: false });
        return doc;
    }

    const existing = snap.data() as UserDoc;
    const mergedProviders = Array.from(
        new Set([...(existing.providers ?? []), ...params.providers]),
    );

    const merged: UserDoc = {
        ...existing,
        email: params.email || existing.email,
        providers: mergedProviders,
    };

    await ref.set(merged, { merge: true });
    return merged;
}

export async function getUserDoc(uid: string): Promise<UserDoc | null> {
    const snap = await adminDb.collection("users").doc(uid).get();
    return snap.exists ? (snap.data() as UserDoc) : null;
}