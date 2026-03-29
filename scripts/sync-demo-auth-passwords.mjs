#!/usr/bin/env node

/**
 * Sets Firebase Auth password for seeded demo tenant accounts to match
 * `src/lib/demo-account-password.ts` (no Firestore changes).
 *
 * Use after a partial DB refresh or if passwords drifted. Full baseline: `pnpm reset:firebase`.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { readDemoPasswordFromRepoRoot } from "./read-demo-password.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, "..");

function loadEnvFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    const content = fs.readFileSync(filePath, "utf8");
    for (const rawLine of content.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith("#")) continue;
        const eq = line.indexOf("=");
        if (eq <= 0) continue;
        const key = line.slice(0, eq).trim();
        const value = line.slice(eq + 1).trim();
        if (!key) continue;
        if (process.env[key] === undefined) {
            process.env[key] = value;
        }
    }
}

function loadEnvFiles(cwd) {
    loadEnvFile(path.join(cwd, ".env"));
    loadEnvFile(path.join(cwd, ".env.local"));
}

function hasFirestoreEmulator() {
    return Boolean(process.env.FIRESTORE_EMULATOR_HOST);
}

function hasAuthEmulator() {
    return Boolean(process.env.FIREBASE_AUTH_EMULATOR_HOST);
}

function isEmulatorMode() {
    return hasFirestoreEmulator() || hasAuthEmulator();
}

function assertRuntimeConfig() {
    if (!isEmulatorMode()) return;
    if (!hasFirestoreEmulator() || !hasAuthEmulator()) {
        throw new Error(
            "Emulator mode requires both FIRESTORE_EMULATOR_HOST and FIREBASE_AUTH_EMULATOR_HOST (same as reset script).",
        );
    }
}

function loadServiceAccount() {
    const b64 = process.env.FIREBASE_ADMIN_JSON_BASE64;
    if (!b64) throw new Error("Missing FIREBASE_ADMIN_JSON_BASE64");

    const raw = Buffer.from(b64, "base64").toString("utf8");
    const parsed = JSON.parse(raw);
    if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
        throw new Error("Invalid FIREBASE_ADMIN_JSON_BASE64 content");
    }

    return {
        projectId: parsed.project_id,
        clientEmail: parsed.client_email,
        privateKey: parsed.private_key,
    };
}

function resolveProjectId() {
    return (
        process.env.FIREBASE_PROJECT_ID?.trim() ||
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() ||
        process.env.GCLOUD_PROJECT?.trim() ||
        process.env.GOOGLE_CLOUD_PROJECT?.trim() ||
        "ticket-core-demo"
    );
}

function initializeFirebaseApp() {
    if (getApps().length > 0) return getApps()[0];

    if (isEmulatorMode()) {
        return initializeApp({
            projectId: resolveProjectId(),
        });
    }

    const sa = loadServiceAccount();
    return initializeApp({
        credential: cert({
            projectId: sa.projectId,
            clientEmail: sa.clientEmail,
            privateKey: sa.privateKey,
        }),
    });
}

/** Must match `TENANT_SEEDS` admin + customer emails in reset-firebase-data.mjs */
const DEMO_FIREBASE_AUTH_EMAILS = ["admina@gmail.com", "cxa@gmail.com", "adminb@gmail.com", "cxb@gmail.com"];

async function main() {
    loadEnvFiles(REPO_ROOT);
    assertRuntimeConfig();

    const password = readDemoPasswordFromRepoRoot(REPO_ROOT);
    initializeFirebaseApp();
    const auth = getAuth();

    console.log("[sync-demo-passwords] updating Firebase Auth passwords to match demo-account-password.ts");
    let ok = 0;
    let missing = 0;

    for (const email of DEMO_FIREBASE_AUTH_EMAILS) {
        try {
            const user = await auth.getUserByEmail(email);
            await auth.updateUser(user.uid, { password });
            console.log(`  ok: ${email}`);
            ok += 1;
        } catch (error) {
            if (error && typeof error === "object" && "code" in error && error.code === "auth/user-not-found") {
                console.warn(`  skip (no Auth user): ${email} — run pnpm reset:firebase to create`);
                missing += 1;
            } else {
                throw error;
            }
        }
    }

    console.log("");
    console.log(`[sync-demo-passwords] done: ${ok} updated, ${missing} missing`);
    console.log("BossAdmin (/bossadmin) uses cookie auth only — not a Firebase Auth user.");
    console.log("Merchant/customer login: use the app login page (Firebase client sign-in), e.g. http://localhost:3000");
}

main().catch((error) => {
    console.error("[sync-demo-passwords] failed", error);
    process.exitCode = 1;
});
