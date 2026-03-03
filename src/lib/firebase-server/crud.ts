import "server-only";
import { fbAdminDb } from "./admin";

export async function fbGetDoc<T extends object>(path: string): Promise<T | null> {
    const snap = await fbAdminDb.doc(path).get();
    return snap.exists ? (snap.data() as T) : null;
}

export async function fbSetDoc<T extends object>(
    path: string,
    data: T,
    opts?: { merge?: boolean },
): Promise<void> {
    await fbAdminDb.doc(path).set(data, { merge: opts?.merge ?? false });
}

export async function fbUpdateDoc<T extends object>(path: string, patch: Partial<T>): Promise<void> {
    await fbAdminDb.doc(path).update(patch as Record<string, unknown>);
}

export async function fbDeleteDoc(path: string): Promise<void> {
    await fbAdminDb.doc(path).delete();
}

export async function fbAddDoc<T extends object>(
    collectionPath: string,
    data: T,
): Promise<{ id: string }> {
    const ref = await fbAdminDb.collection(collectionPath).add(data);
    return { id: ref.id };
}