import "server-only";
import { FieldValue, type DocumentData } from "firebase-admin/firestore";
import { fbAdminDb } from "@/lib/firebase-server";

export { FieldValue };

export function serverTimestamp() {
    return FieldValue.serverTimestamp();
}

/** Add document with createdAt / updatedAt server timestamps. */
export async function createDoc<T extends DocumentData>(collectionPath: string, data: T): Promise<string> {
    const ref = await fbAdminDb.collection(collectionPath).add({
        ...data,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    });
    return ref.id;
}

export async function setDoc<T extends DocumentData>(
    docPath: string,
    data: T,
    options?: { merge?: boolean },
): Promise<void> {
    await fbAdminDb.doc(docPath).set(
        {
            ...data,
            updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: options?.merge ?? false },
    );
}

export async function updateDoc(docPath: string, data: DocumentData): Promise<void> {
    await fbAdminDb.doc(docPath).update({
        ...data,
        updatedAt: FieldValue.serverTimestamp(),
    });
}

export async function getDoc(docPath: string): Promise<DocumentData | undefined> {
    const snap = await fbAdminDb.doc(docPath).get();
    return snap.data();
}

export async function queryCollectionOrdered(
    collectionPath: string,
    orderField: string,
    direction: "asc" | "desc",
    limit: number,
): Promise<Array<{ id: string; data: DocumentData }>> {
    const snap = await fbAdminDb
        .collection(collectionPath)
        .orderBy(orderField, direction)
        .limit(limit)
        .get();
    return snap.docs.map((d) => ({ id: d.id, data: d.data() }));
}
