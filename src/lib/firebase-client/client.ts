import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";

type FirebaseWebConfig = {
    apiKey: string;
    authDomain: string;
    projectId: string;
    appId: string;
};

function normalizeEnv(value: string | undefined): string {
    return value?.trim() ?? "";
}

const firebaseConfig: FirebaseWebConfig = {
    apiKey: normalizeEnv(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
    authDomain: normalizeEnv(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
    projectId: normalizeEnv(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
    appId: normalizeEnv(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
};

const missingFirebaseConfigKeys = Object.entries(firebaseConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key);

export const firebaseClientReady = missingFirebaseConfigKeys.length === 0;
export const firebaseClientConfigError = firebaseClientReady
    ? null
    : `Firebase 前端設定缺失：${missingFirebaseConfigKeys.join(", ")}`;

let cachedApp: FirebaseApp | null = null;
let cachedAuth: Auth | null = null;
let cachedGoogleProvider: GoogleAuthProvider | null = null;

function ensureFirebaseClientReady() {
    if (!firebaseClientReady) {
        throw new Error(firebaseClientConfigError ?? "Firebase 前端設定缺失");
    }
}

function getFirebaseClientApp(): FirebaseApp {
    ensureFirebaseClientReady();
    if (cachedApp) return cachedApp;
    cachedApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
    return cachedApp;
}

function getFirebaseClientAuth(): Auth {
    if (cachedAuth) return cachedAuth;
    cachedAuth = getAuth(getFirebaseClientApp());
    return cachedAuth;
}

function getFirebaseGoogleProvider(): GoogleAuthProvider {
    if (cachedGoogleProvider) return cachedGoogleProvider;
    cachedGoogleProvider = new GoogleAuthProvider();
    return cachedGoogleProvider;
}

function bindProxyMethod<T extends object>(instance: T, prop: PropertyKey) {
    const value = Reflect.get(instance, prop);
    return typeof value === "function" ? value.bind(instance) : value;
}

export function getFirebaseClientErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message) return error.message;
    return firebaseClientConfigError ?? "Firebase 設定異常，請聯絡管理員。";
}

export const fbAuth = new Proxy({} as Auth, {
    get(_target, prop) {
        return bindProxyMethod(getFirebaseClientAuth(), prop);
    },
    set(_target, prop, value) {
        Reflect.set(getFirebaseClientAuth(), prop, value);
        return true;
    },
}) as Auth;

export const fbGoogleProvider = new Proxy({} as GoogleAuthProvider, {
    get(_target, prop) {
        return bindProxyMethod(getFirebaseGoogleProvider(), prop);
    },
    set(_target, prop, value) {
        Reflect.set(getFirebaseGoogleProvider(), prop, value);
        return true;
    },
}) as GoogleAuthProvider;
