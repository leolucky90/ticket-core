import "server-only";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

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

const sa = loadServiceAccount();

const app =
    getApps().length === 0
        ? initializeApp({
            credential: cert({
                projectId: sa.projectId,
                clientEmail: sa.clientEmail,
                privateKey: sa.privateKey,
            }),
        })
        : getApps()[0];

export const fbAdminAuth = getAuth(app);
export const fbAdminDb = getFirestore(app);