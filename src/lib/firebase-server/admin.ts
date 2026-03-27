import "server-only";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

function loadServiceAccount(): { projectId: string; clientEmail: string; privateKey: string } {
    const b64 = process.env.FIREBASE_ADMIN_JSON_BASE64;
    if (!b64) throw new Error("Missing FIREBASE_ADMIN_JSON_BASE64");

    const raw = Buffer.from(b64, "base64").toString("utf8");
    const parsed = JSON.parse(raw) as {
        project_id: string;
        client_email: string;
        private_key: string;
    };

    if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
        throw new Error("Invalid FIREBASE_ADMIN_JSON_BASE64 content");
    }

    return {
        projectId: parsed.project_id,
        clientEmail: parsed.client_email,
        privateKey: parsed.private_key,
    };
}

let cachedAuth: Auth | null = null;
let cachedDb: Firestore | null = null;

function getFirebaseAdminApp() {
    const existing = getApps()[0];
    if (existing) return existing;

    const sa = loadServiceAccount();
    const storageBucket =
        process.env.FIREBASE_STORAGE_BUCKET?.trim() ||
        process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim() ||
        `${sa.projectId}.firebasestorage.app`;

    return initializeApp({
        credential: cert({
            projectId: sa.projectId,
            clientEmail: sa.clientEmail,
            privateKey: sa.privateKey,
        }),
        storageBucket,
    });
}

function getFirebaseAdminAuth(): Auth {
    if (cachedAuth) return cachedAuth;
    cachedAuth = getAuth(getFirebaseAdminApp());
    return cachedAuth;
}

function getFirebaseAdminDb(): Firestore {
    if (cachedDb) return cachedDb;
    cachedDb = getFirestore(getFirebaseAdminApp());
    return cachedDb;
}

function bindProxyMethod<T extends object>(instance: T, prop: PropertyKey) {
    const value = Reflect.get(instance, prop);
    return typeof value === "function" ? value.bind(instance) : value;
}

export const fbAdminAuth = new Proxy({} as Auth, {
    get(_target, prop) {
        return bindProxyMethod(getFirebaseAdminAuth(), prop);
    },
}) as Auth;

export const fbAdminDb = new Proxy({} as Firestore, {
    get(_target, prop) {
        return bindProxyMethod(getFirebaseAdminDb(), prop);
    },
}) as Firestore;
