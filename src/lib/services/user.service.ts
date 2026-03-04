import "server-only";
import { fbAdminDb } from "@/lib/firebase-server";

export type UserDoc = {
    uid: string;
    email: string;
    role: "staff" | "manager" | "company_admin" | "owner" | "super_admin" | "viewer";
    createdAt: number;
    providers: string[];
};

export async function ensureUserDoc(params: {
    uid: string;
    email: string;
    providers: string[];
}): Promise<UserDoc> {
    const ref = fbAdminDb.collection("users").doc(params.uid);
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
    const mergedProviders = Array.from(new Set([...(existing.providers ?? []), ...params.providers]));

    const merged: UserDoc = {
        ...existing,
        email: params.email || existing.email,
        providers: mergedProviders,
    };

    await ref.set(merged, { merge: true });
    return merged;
}

export async function getUserDoc(uid: string): Promise<UserDoc | null> {
    const snap = await fbAdminDb.collection("users").doc(uid).get();
    return snap.exists ? (snap.data() as UserDoc) : null;
}