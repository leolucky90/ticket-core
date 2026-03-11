#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const ACCOUNTS = {
    adminA: { email: "admina@gmail.com", password: "123456", displayName: "A Company Admin" },
    customerA: { email: "cxa@gmail.com", password: "123456", displayName: "A Customer" },
    adminB: { email: "adminb@gmail.com", password: "123456", displayName: "B Company Admin" },
    customerB: { email: "cxb@gmail.com", password: "123456", displayName: "B Customer" },
};

const COMPANY_A_ID = "company_a";
const COMPANY_B_ID = "company_b";
const CUSTOMER_A_ID = "cx_a";
const CUSTOMER_B_ID = "cx_b";

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

async function clearCollection(db, pathName) {
    const ref = db.collection(pathName);
    const one = await ref.limit(1).get();
    if (one.empty) return;
    await db.recursiveDelete(ref);
}

async function deleteAuthUserByEmail(auth, email) {
    try {
        const user = await auth.getUserByEmail(email);
        await auth.deleteUser(user.uid);
    } catch (error) {
        if (error && typeof error === "object" && "code" in error && error.code === "auth/user-not-found") {
            return;
        }
        throw error;
    }
}

async function ensureAuthUser(auth, account) {
    const existing = await auth.getUserByEmail(account.email).catch((error) => {
        if (error && typeof error === "object" && "code" in error && error.code === "auth/user-not-found") {
            return null;
        }
        throw error;
    });

    if (existing) {
        await auth.updateUser(existing.uid, {
            password: account.password,
            displayName: account.displayName,
            emailVerified: true,
            disabled: false,
        });
        return await auth.getUser(existing.uid);
    }

    return await auth.createUser({
        email: account.email,
        password: account.password,
        displayName: account.displayName,
        emailVerified: true,
        disabled: false,
    });
}

function baseCompanyDoc(params) {
    const ts = Date.now();
    return {
        id: params.id,
        name: params.name,
        slug: params.slug,
        subdomain: params.slug,
        createdAt: ts,
        updatedAt: ts,
        ownerUid: params.ownerUid,
        ownerEmail: params.ownerEmail,
    };
}

function baseUserDoc(params) {
    return {
        uid: params.uid,
        email: params.email.toLowerCase(),
        role: params.role,
        companyId: params.companyId,
        customerId: params.customerId ?? null,
        createdAt: Date.now(),
        providers: ["password"],
    };
}

function baseCustomerDoc(params) {
    const ts = Date.now();
    return {
        id: params.id,
        companyId: params.companyId,
        userUid: params.userUid,
        email: params.email.toLowerCase(),
        emailLower: params.email.toLowerCase(),
        name: params.name,
        phone: params.phone,
        address: params.address,
        createdAt: ts,
        updatedAt: ts,
        lastCaseAt: ts,
    };
}

function baseCaseDoc(params) {
    const ts = Date.now();
    return {
        id: params.id,
        companyId: params.companyId,
        customerId: params.customerId,
        title: `${params.customerName} - ${params.deviceName}`,
        status: "new",
        customer: {
            name: params.customerName,
            phone: params.customerPhone,
            address: params.customerAddress,
            email: params.customerEmail.toLowerCase(),
        },
        device: {
            name: params.deviceName,
            model: params.deviceModel,
        },
        repairReason: params.repairReason,
        repairSuggestion: "",
        note: "seed data",
        repairAmount: params.repairAmount,
        inspectionFee: params.inspectionFee,
        pendingFee: params.repairAmount - params.inspectionFee,
        quoteStatus: "inspection_estimate",
        createdAt: ts,
        updatedAt: ts,
    };
}

function baseSaleDoc(params) {
    const ts = Date.now();
    return {
        id: params.id,
        companyId: params.companyId,
        item: params.item,
        amount: params.amount,
        checkoutAt: ts,
        paymentMethod: params.paymentMethod,
        createdAt: ts,
        updatedAt: ts,
    };
}

async function main() {
    const cwd = process.cwd();
    loadEnvFile(path.join(cwd, ".env.local"));

    const sa = loadServiceAccount();
    const app =
        getApps().length > 0
            ? getApps()[0]
            : initializeApp({
                  credential: cert({
                      projectId: sa.projectId,
                      clientEmail: sa.clientEmail,
                      privateKey: sa.privateKey,
                  }),
              });

    const auth = getAuth(app);
    const db = getFirestore(app);

    console.log("[reset] clearing Firestore collections...");
    for (const coll of ["cases", "sales", "users", "companies", "domains", "app_config"]) {
        await clearCollection(db, coll);
    }

    console.log("[reset] deleting old auth users (if exists)...");
    for (const account of Object.values(ACCOUNTS)) {
        await deleteAuthUserByEmail(auth, account.email);
    }

    console.log("[reset] creating auth users...");
    const adminA = await ensureAuthUser(auth, ACCOUNTS.adminA);
    const customerA = await ensureAuthUser(auth, ACCOUNTS.customerA);
    const adminB = await ensureAuthUser(auth, ACCOUNTS.adminB);
    const customerB = await ensureAuthUser(auth, ACCOUNTS.customerB);

    console.log("[reset] writing multi-tenant seed data...");
    const batch = db.batch();

    batch.set(
        db.doc(`companies/${COMPANY_A_ID}`),
        baseCompanyDoc({
            id: COMPANY_A_ID,
            name: "A 公司",
            slug: "company-a",
            ownerUid: adminA.uid,
            ownerEmail: ACCOUNTS.adminA.email,
        }),
        { merge: false },
    );
    batch.set(
        db.doc(`companies/${COMPANY_B_ID}`),
        baseCompanyDoc({
            id: COMPANY_B_ID,
            name: "B 公司",
            slug: "company-b",
            ownerUid: adminB.uid,
            ownerEmail: ACCOUNTS.adminB.email,
        }),
        { merge: false },
    );

    batch.set(
        db.doc(`users/${adminA.uid}`),
        baseUserDoc({
            uid: adminA.uid,
            email: ACCOUNTS.adminA.email,
            role: "company_admin",
            companyId: COMPANY_A_ID,
            customerId: null,
        }),
        { merge: false },
    );
    batch.set(
        db.doc(`users/${customerA.uid}`),
        baseUserDoc({
            uid: customerA.uid,
            email: ACCOUNTS.customerA.email,
            role: "customer",
            companyId: COMPANY_A_ID,
            customerId: CUSTOMER_A_ID,
        }),
        { merge: false },
    );
    batch.set(
        db.doc(`users/${adminB.uid}`),
        baseUserDoc({
            uid: adminB.uid,
            email: ACCOUNTS.adminB.email,
            role: "company_admin",
            companyId: COMPANY_B_ID,
            customerId: null,
        }),
        { merge: false },
    );
    batch.set(
        db.doc(`users/${customerB.uid}`),
        baseUserDoc({
            uid: customerB.uid,
            email: ACCOUNTS.customerB.email,
            role: "customer",
            companyId: COMPANY_B_ID,
            customerId: CUSTOMER_B_ID,
        }),
        { merge: false },
    );

    batch.set(
        db.doc(`companies/${COMPANY_A_ID}/customers/${CUSTOMER_A_ID}`),
        baseCustomerDoc({
            id: CUSTOMER_A_ID,
            companyId: COMPANY_A_ID,
            userUid: customerA.uid,
            email: ACCOUNTS.customerA.email,
            name: "A 客戶",
            phone: "0911000001",
            address: "台北市 A 路 1 號",
        }),
        { merge: false },
    );
    batch.set(
        db.doc(`companies/${COMPANY_B_ID}/customers/${CUSTOMER_B_ID}`),
        baseCustomerDoc({
            id: CUSTOMER_B_ID,
            companyId: COMPANY_B_ID,
            userUid: customerB.uid,
            email: ACCOUNTS.customerB.email,
            name: "B 客戶",
            phone: "0911000002",
            address: "台中市 B 路 2 號",
        }),
        { merge: false },
    );

    batch.set(
        db.doc(`companies/${COMPANY_A_ID}/cases/case_a_001`),
        baseCaseDoc({
            id: "case_a_001",
            companyId: COMPANY_A_ID,
            customerId: CUSTOMER_A_ID,
            customerName: "A 客戶",
            customerPhone: "0911000001",
            customerAddress: "台北市 A 路 1 號",
            customerEmail: ACCOUNTS.customerA.email,
            deviceName: "A 冷氣",
            deviceModel: "AC-100A",
            repairReason: "冷氣不冷",
            repairAmount: 2500,
            inspectionFee: 300,
        }),
        { merge: false },
    );
    batch.set(
        db.doc(`companies/${COMPANY_B_ID}/cases/case_b_001`),
        baseCaseDoc({
            id: "case_b_001",
            companyId: COMPANY_B_ID,
            customerId: CUSTOMER_B_ID,
            customerName: "B 客戶",
            customerPhone: "0911000002",
            customerAddress: "台中市 B 路 2 號",
            customerEmail: ACCOUNTS.customerB.email,
            deviceName: "B 洗衣機",
            deviceModel: "WM-200B",
            repairReason: "排水異常",
            repairAmount: 1800,
            inspectionFee: 200,
        }),
        { merge: false },
    );

    batch.set(
        db.doc(`companies/${COMPANY_A_ID}/sales/sale_a_001`),
        baseSaleDoc({
            id: "sale_a_001",
            companyId: COMPANY_A_ID,
            item: "A 維修方案",
            amount: 2500,
            paymentMethod: "cash",
        }),
        { merge: false },
    );
    batch.set(
        db.doc(`companies/${COMPANY_B_ID}/sales/sale_b_001`),
        baseSaleDoc({
            id: "sale_b_001",
            companyId: COMPANY_B_ID,
            item: "B 維修方案",
            amount: 1800,
            paymentMethod: "card",
        }),
        { merge: false },
    );

    batch.set(
        db.doc(`companies/${COMPANY_A_ID}/app_config/showcase`),
        {
            updatedAt: Date.now(),
            updatedBy: adminA.uid,
            content: {
                heroTitle: "A 公司首頁",
            },
        },
        { merge: true },
    );
    batch.set(
        db.doc(`companies/${COMPANY_B_ID}/app_config/showcase`),
        {
            updatedAt: Date.now(),
            updatedBy: adminB.uid,
            content: {
                heroTitle: "B 公司首頁",
            },
        },
        { merge: true },
    );

    await batch.commit();

    console.log("[reset] done");
    console.log("=== Test Accounts ===");
    console.log(`A公司: ${ACCOUNTS.adminA.email} / ${ACCOUNTS.adminA.password}`);
    console.log(`A客戶: ${ACCOUNTS.customerA.email} / ${ACCOUNTS.customerA.password}`);
    console.log(`B公司: ${ACCOUNTS.adminB.email} / ${ACCOUNTS.adminB.password}`);
    console.log(`B客戶: ${ACCOUNTS.customerB.email} / ${ACCOUNTS.customerB.password}`);
    console.log("=== Company IDs ===");
    console.log(`A: ${COMPANY_A_ID}, customer: ${CUSTOMER_A_ID}`);
    console.log(`B: ${COMPANY_B_ID}, customer: ${CUSTOMER_B_ID}`);
}

main().catch((error) => {
    console.error("[reset] failed", error);
    process.exitCode = 1;
});
