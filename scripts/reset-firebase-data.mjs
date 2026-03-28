#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const DEMO_PASSWORD = "123456";
const DAY_MS = 24 * 60 * 60 * 1000;
const ROOT_RESET_COLLECTIONS = ["app_config", "cases", "sales", "users", "companies", "domains"];

const OFFICIAL_LOGIN = {
    email: "bossadmin@gmail.com",
    password: DEMO_PASSWORD,
    path: "/bossadmin",
};

const DEFAULT_PERMISSION_MAP = {
    1: ["dashboard.view"],
    2: ["dashboard.view", "products.view"],
    3: ["dashboard.view", "products.view", "inventory.edit"],
    4: ["dashboard.view", "products.view", "inventory.edit", "customers.delete"],
    5: ["dashboard.view", "settings.view", "products.delete", "deleteLogs.view", "deleteLogs.restore"],
    6: ["dashboard.view", "settings.view", "settings.edit", "campaigns.manage", "deleteLogs.view", "deleteLogs.restore"],
    7: ["dashboard.view", "settings.view", "settings.edit", "campaigns.manage", "reports.export", "deleteLogs.view", "deleteLogs.restore"],
    8: [
        "dashboard.view",
        "settings.view",
        "settings.edit",
        "staff.view",
        "staff.create",
        "staff.edit",
        "staff.delete",
        "staff.resetPassword",
        "staff.deleted.view",
        "staff.restore",
        "security.deleteControl.view",
        "security.deleteControl.edit",
        "deleteLogs.view",
        "deleteLogs.restore",
    ],
    9: [
        "dashboard.view",
        "settings.view",
        "settings.edit",
        "staff.view",
        "staff.create",
        "staff.edit",
        "staff.delete",
        "staff.resetPassword",
        "staff.deleted.view",
        "staff.restore",
        "staff.hardDelete",
        "security.deleteControl.view",
        "security.deleteControl.edit",
        "deleteLogs.view",
        "deleteLogs.restore",
        "deleteLogs.hardDelete",
        "hard_delete_authorized",
    ],
};

const TENANT_SEEDS = [
    {
        companyId: "company_a",
        slug: "company-a",
        name: "A 公司",
        phone: "02-2711-0001",
        address: "台北市中山區維修路 101 號",
        paymentInfo: "月結匯款 / 統編發票",
        subscriptionAmount: 2499,
        subscriptionStartDaysAgo: 2,
        admin: {
            staffMemberId: "staff_admin_a",
            email: "admina@gmail.com",
            password: DEMO_PASSWORD,
            displayName: "A Company Admin",
            name: "A 公司管理員",
        },
        customer: {
            customerId: "cx_a",
            email: "cxa@gmail.com",
            password: DEMO_PASSWORD,
            displayName: "A Customer",
            name: "A 客戶",
            phone: "0911000001",
            address: "台北市信義區展示路 1 號",
        },
        ticket: {
            id: "ticket_a_001",
            title: "A 客戶 - iPhone 15 Pro Max",
            status: "new",
            quoteStatus: "inspection_estimate",
            deviceName: "iPhone",
            deviceModel: "15 Pro Max",
            repairReason: "螢幕破裂與觸控異常",
            repairSuggestion: "先做面板檢測與排線確認",
            note: "Phase 2 seed baseline",
            repairAmount: 4800,
            inspectionFee: 300,
        },
        sale: {
            id: "sale_a_001",
            item: "A 公司螢幕維修方案",
            amount: 4800,
            paymentMethod: "cash",
        },
        showcaseHeroTitle: "A 公司首頁",
    },
    {
        companyId: "company_b",
        slug: "company-b",
        name: "B 公司",
        phone: "04-2311-0002",
        address: "台中市西屯區服務路 202 號",
        paymentInfo: "刷卡 / 月費扣款",
        subscriptionAmount: 3999,
        subscriptionStartDaysAgo: 11,
        admin: {
            staffMemberId: "staff_admin_b",
            email: "adminb@gmail.com",
            password: DEMO_PASSWORD,
            displayName: "B Company Admin",
            name: "B 公司管理員",
        },
        customer: {
            customerId: "cx_b",
            email: "cxb@gmail.com",
            password: DEMO_PASSWORD,
            displayName: "B Customer",
            name: "B 客戶",
            phone: "0911000002",
            address: "台中市南屯區體驗路 2 號",
        },
        ticket: {
            id: "ticket_b_001",
            title: "B 客戶 - Samsung S24 Ultra",
            status: "in_progress",
            quoteStatus: "inspection_estimate",
            deviceName: "Samsung",
            deviceModel: "S24 Ultra",
            repairReason: "電池膨脹與背蓋鬆脫",
            repairSuggestion: "更換電池並重新封裝防水膠",
            note: "Phase 2 seed baseline",
            repairAmount: 3600,
            inspectionFee: 200,
        },
        sale: {
            id: "sale_b_001",
            item: "B 公司電池維修方案",
            amount: 3600,
            paymentMethod: "card",
        },
        showcaseHeroTitle: "B 公司首頁",
    },
];

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
            "Emulator mode requires both FIRESTORE_EMULATOR_HOST and FIREBASE_AUTH_EMULATOR_HOST for a full reset/seed run.",
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

function nowTs() {
    return Date.now();
}

function daysAgo(baseTs, daysAgo) {
    return baseTs - daysAgo * DAY_MS;
}

function toIso(ts) {
    return new Date(ts).toISOString();
}

function createDefaultSecuritySettings(updatedBy, ts) {
    return {
        deleteButtonEnabled: true,
        requirePasswordWhenDeleteDisabled: true,
        requireSecondConfirmation: true,
        requireReasonOnDelete: false,
        deleteAuditLogEnabled: true,
        softDeleteOnly: true,
        allowLevelToDeleteFrom: 5,
        restoreEnabled: true,
        hardDeleteEnabled: false,
        allowLevelToHardDeleteFrom: 9,
        requirePasswordForHardDelete: true,
        requireReasonOnHardDelete: true,
        employeeRestoreLevel: 8,
        employeeHardDeleteLevel: 9,
        employeeStrictOwnerOnly: true,
        updatedAt: toIso(ts),
        updatedBy,
    };
}

function createPermissionLevelDoc(level, updatedBy, ts) {
    const displayNames = {
        1: "新員工",
        2: "員工",
        3: "資深員工",
        4: "組長",
        5: "店長",
        6: "區主管",
        7: "營運主管",
        8: "管理員",
        9: "超級管理員",
    };

    return {
        level,
        code: `LV${level}`,
        displayName: displayNames[level],
        isActive: true,
        permissions: DEFAULT_PERMISSION_MAP[level] ?? [],
        createdAt: toIso(ts),
        updatedAt: toIso(ts),
        updatedBy,
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

function buildCompanyDoc(seed, adminUid, ts) {
    const subscriptionStartAt = daysAgo(ts, seed.subscriptionStartDaysAgo);
    const subscriptionEndAt = subscriptionStartAt + 30 * DAY_MS;

    return {
        id: seed.companyId,
        name: seed.name,
        slug: seed.slug,
        subdomain: seed.slug,
        phone: seed.phone,
        address: seed.address,
        paymentInfo: seed.paymentInfo,
        ownerUid: adminUid,
        ownerEmail: seed.admin.email,
        createdAt: ts,
        updatedAt: ts,
        subscriptionStartAt,
        subscriptionEndAt,
        subscriptionAmount: seed.subscriptionAmount,
        lastShowcaseUpdatedAt: ts,
        lastUpdatedBy: adminUid,
    };
}

function buildUserDoc(params) {
    return {
        uid: params.uid,
        email: params.email.toLowerCase(),
        displayName: params.displayName,
        role: params.role,
        companyId: params.companyId,
        customerId: params.customerId ?? null,
        createdAt: params.ts,
        updatedAt: params.ts,
        updatedBy: params.updatedBy,
        providers: ["password"],
    };
}

function buildCustomerDoc(params) {
    return {
        id: params.customerId,
        companyId: params.companyId,
        userUid: params.userUid,
        email: params.email.toLowerCase(),
        emailLower: params.email.toLowerCase(),
        name: params.name,
        phone: params.phone,
        address: params.address,
        createdAt: params.ts,
        updatedAt: params.ts,
        lastCaseAt: params.ts,
    };
}

function buildStaffMemberDoc(params) {
    const createdAtIso = toIso(params.ts);
    return {
        id: params.staffMemberId,
        uid: params.uid,
        name: params.name,
        phone: params.phone,
        address: params.address,
        email: params.email.toLowerCase(),
        roleLevel: 8,
        roleNameSnapshot: "管理員",
        status: "active",
        mustChangePassword: false,
        isRepairTechnician: false,
        googleLinked: false,
        createdAt: createdAtIso,
        createdBy: params.updatedBy,
        updatedAt: createdAtIso,
        updatedBy: params.updatedBy,
        isDeleted: false,
        deletedAt: null,
        deletedBy: "",
        deleteReason: "",
    };
}

function buildTicketDoc(seed, ts) {
    return {
        id: seed.ticket.id,
        title: seed.ticket.title,
        status: seed.ticket.status,
        quoteStatus: seed.ticket.quoteStatus,
        customer: {
            name: seed.customer.name,
            phone: seed.customer.phone,
            address: seed.customer.address,
            email: seed.customer.email.toLowerCase(),
        },
        device: {
            name: seed.ticket.deviceName,
            model: seed.ticket.deviceModel,
        },
        repairReason: seed.ticket.repairReason,
        repairSuggestion: seed.ticket.repairSuggestion,
        note: seed.ticket.note,
        repairAmount: seed.ticket.repairAmount,
        inspectionFee: seed.ticket.inspectionFee,
        pendingFee: seed.ticket.repairAmount - seed.ticket.inspectionFee,
        companyId: seed.companyId,
        customerId: seed.customer.customerId,
        createdAt: ts,
        updatedAt: ts,
    };
}

function buildSaleDoc(seed, ts) {
    return {
        id: seed.sale.id,
        companyId: seed.companyId,
        customerId: seed.customer.customerId,
        item: seed.sale.item,
        amount: seed.sale.amount,
        checkoutAt: ts,
        paymentMethod: seed.sale.paymentMethod,
        createdAt: ts,
        updatedAt: ts,
    };
}

function buildCompanyProfileDoc(seed, adminUid, ts) {
    const createdAtIso = toIso(ts);
    return {
        companyId: seed.companyId,
        companyName: seed.name,
        displayName: seed.name,
        contactName: seed.admin.name,
        phone: seed.phone,
        email: seed.admin.email.toLowerCase(),
        address: seed.address,
        country: "Taiwan",
        region: "",
        postcode: "",
        taxId: "",
        abn: "",
        businessRegistrationNumber: "",
        invoiceNote: `${seed.name} seed baseline invoice note`,
        receiptNote: `${seed.name} seed baseline receipt note`,
        createdAt: createdAtIso,
        updatedAt: createdAtIso,
        updatedBy: adminUid,
    };
}

function buildShowcaseDoc(seed, adminUid, ts) {
    return {
        updatedAt: ts,
        updatedBy: adminUid,
        storefront: {
            shoppingEnabled: true,
            autoRedirectToShopForCustomer: false,
            showCartOnNavForCustomer: false,
        },
        content: {
            heroTitle: seed.showcaseHeroTitle,
        },
    };
}

function buildOfficialHomepageDoc(ts) {
    return {
        updatedAt: ts,
        updatedBy: OFFICIAL_LOGIN.email,
        content: {
            theme: { preset: "forest" },
            locale: {
                zh: {
                    title: "Ticket Core 官方首頁",
                },
                en: {
                    title: "Ticket Core Official Homepage",
                },
            },
        },
    };
}

function logUsage() {
    console.log("Usage: pnpm reset:firebase");
    console.log("");
    console.log("Reads .env/.env.local, clears demo Firestore data, recreates managed demo auth users,");
    console.log("and seeds stable company/customer baselines under companies/{companyId}.");
    console.log("");
    console.log("Requirements:");
    console.log("- Emulator mode: set both FIRESTORE_EMULATOR_HOST and FIREBASE_AUTH_EMULATOR_HOST");
    console.log("- Hosted Firebase mode: FIREBASE_ADMIN_JSON_BASE64");
}

async function main() {
    if (process.argv.includes("--help") || process.argv.includes("-h")) {
        logUsage();
        return;
    }

    const cwd = process.cwd();
    loadEnvFiles(cwd);
    assertRuntimeConfig();

    const app = initializeFirebaseApp();
    const auth = getAuth(app);
    const db = getFirestore(app);
    const seededAt = nowTs();

    console.log(`[reset] mode: ${isEmulatorMode() ? "emulator" : "firebase project"}`);
    console.log("[reset] clearing Firestore collections...");
    for (const coll of ROOT_RESET_COLLECTIONS) {
        await clearCollection(db, coll);
    }

    console.log("[reset] deleting managed auth users...");
    await deleteAuthUserByEmail(auth, OFFICIAL_LOGIN.email);
    for (const seed of TENANT_SEEDS) {
        await deleteAuthUserByEmail(auth, seed.admin.email);
        await deleteAuthUserByEmail(auth, seed.customer.email);
    }

    console.log("[reset] recreating managed demo auth users...");
    const authRecords = new Map();
    for (const seed of TENANT_SEEDS) {
        const adminRecord = await ensureAuthUser(auth, seed.admin);
        const customerRecord = await ensureAuthUser(auth, seed.customer);
        authRecords.set(`${seed.companyId}:admin`, adminRecord);
        authRecords.set(`${seed.companyId}:customer`, customerRecord);
    }

    console.log("[reset] writing official baseline and tenant seed data...");
    const batch = db.batch();

    batch.set(db.doc("app_config/business_homepage"), buildOfficialHomepageDoc(seededAt), { merge: false });

    for (const seed of TENANT_SEEDS) {
        const adminRecord = authRecords.get(`${seed.companyId}:admin`);
        const customerRecord = authRecords.get(`${seed.companyId}:customer`);
        if (!adminRecord || !customerRecord) {
            throw new Error(`Missing auth records for ${seed.companyId}`);
        }

        batch.set(
            db.doc(`companies/${seed.companyId}`),
            buildCompanyDoc(seed, adminRecord.uid, seededAt),
            { merge: false },
        );

        batch.set(
            db.doc(`users/${adminRecord.uid}`),
            buildUserDoc({
                uid: adminRecord.uid,
                email: seed.admin.email,
                displayName: seed.admin.displayName,
                role: "company_admin",
                companyId: seed.companyId,
                customerId: null,
                ts: seededAt,
                updatedBy: adminRecord.uid,
            }),
            { merge: false },
        );

        batch.set(
            db.doc(`users/${customerRecord.uid}`),
            buildUserDoc({
                uid: customerRecord.uid,
                email: seed.customer.email,
                displayName: seed.customer.displayName,
                role: "customer",
                companyId: seed.companyId,
                customerId: seed.customer.customerId,
                ts: seededAt,
                updatedBy: adminRecord.uid,
            }),
            { merge: false },
        );

        batch.set(
            db.doc(`companies/${seed.companyId}/customers/${seed.customer.customerId}`),
            buildCustomerDoc({
                companyId: seed.companyId,
                customerId: seed.customer.customerId,
                userUid: customerRecord.uid,
                email: seed.customer.email,
                name: seed.customer.name,
                phone: seed.customer.phone,
                address: seed.customer.address,
                ts: seededAt,
            }),
            { merge: false },
        );

        batch.set(
            db.doc(`companies/${seed.companyId}/staffMembers/${seed.admin.staffMemberId}`),
            buildStaffMemberDoc({
                staffMemberId: seed.admin.staffMemberId,
                uid: adminRecord.uid,
                name: seed.admin.name,
                phone: seed.phone,
                address: seed.address,
                email: seed.admin.email,
                ts: seededAt,
                updatedBy: adminRecord.uid,
            }),
            { merge: false },
        );

        batch.set(
            db.doc(`companies/${seed.companyId}/cases/${seed.ticket.id}`),
            buildTicketDoc(seed, seededAt),
            { merge: false },
        );

        batch.set(
            db.doc(`companies/${seed.companyId}/sales/${seed.sale.id}`),
            buildSaleDoc(seed, seededAt),
            { merge: false },
        );

        batch.set(
            db.doc(`companies/${seed.companyId}/settings/companyProfile`),
            buildCompanyProfileDoc(seed, adminRecord.uid, seededAt),
            { merge: false },
        );

        batch.set(
            db.doc(`companies/${seed.companyId}/settings/delete-control`),
            createDefaultSecuritySettings(adminRecord.uid, seededAt),
            { merge: false },
        );

        batch.set(
            db.doc(`companies/${seed.companyId}/app_config/showcase`),
            buildShowcaseDoc(seed, adminRecord.uid, seededAt),
            { merge: false },
        );

        for (let level = 1; level <= 9; level += 1) {
            batch.set(
                db.doc(`companies/${seed.companyId}/permissionLevels/lv${level}`),
                createPermissionLevelDoc(level, adminRecord.uid, seededAt),
                { merge: false },
            );
        }
    }

    await batch.commit();

    console.log("[reset] done");
    console.log("");
    console.log("=== Official Hidden Login ===");
    console.log(`${OFFICIAL_LOGIN.path} -> ${OFFICIAL_LOGIN.email} / ${OFFICIAL_LOGIN.password}`);
    console.log("note: BossAdmin remains cookie-auth only and is intentionally not created in Firebase Auth / users/{uid}");
    console.log("");
    console.log("=== Demo Firebase Accounts ===");
    for (const seed of TENANT_SEEDS) {
        console.log(`${seed.companyId} admin: ${seed.admin.email} / ${seed.admin.password}`);
        console.log(`${seed.companyId} customer: ${seed.customer.email} / ${seed.customer.password}`);
    }
    console.log("");
    console.log("=== Demo Routes ===");
    for (const seed of TENANT_SEEDS) {
        console.log(`${seed.companyId} public: /${seed.companyId}`);
        console.log(`${seed.companyId} customer dashboard: /${seed.companyId}/dashboard`);
        console.log(`${seed.companyId} merchant dashboard: /dashboard`);
    }
}

main().catch((error) => {
    console.error("[reset] failed", error);
    process.exitCode = 1;
});
