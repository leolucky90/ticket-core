import { NextResponse } from "next/server";
import { getApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { getSessionUser } from "@/lib/auth-enterprise/session.server";
import { getShowcaseTenantId, getUserDoc, toAccountType } from "@/lib/services/user.service";

const MAX_UPLOAD_SIZE_BYTES = 12 * 1024 * 1024;

function sanitizeFileExtension(fileName: string, contentType: string): string {
    const matched = fileName.toLowerCase().match(/\.([a-z0-9]+)$/);
    if (matched) return `.${matched[1]}`;
    if (contentType === "image/png") return ".png";
    if (contentType === "image/webp") return ".webp";
    if (contentType === "image/gif") return ".gif";
    return ".jpg";
}

function normalizeBucketName(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) return "";
    const withoutPrefix = trimmed.startsWith("gs://") ? trimmed.slice("gs://".length) : trimmed;
    const normalized = withoutPrefix.replace(/\/+$/, "");
    const firstSegment = normalized.split("/")[0];
    return firstSegment.trim();
}

function getBucketCandidates() {
    const app = getApp();
    const adminProjectId = typeof app.options.projectId === "string" ? app.options.projectId.trim() : "";
    const adminStorageBucket = typeof app.options.storageBucket === "string" ? app.options.storageBucket.trim() : "";
    const publicProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() ?? "";

    return Array.from(
        new Set(
            [
                process.env.FIREBASE_STORAGE_BUCKET ?? "",
                process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
                adminStorageBucket,
                adminProjectId ? `${adminProjectId}.firebasestorage.app` : "",
                adminProjectId ? `${adminProjectId}.appspot.com` : "",
                publicProjectId ? `${publicProjectId}.firebasestorage.app` : "",
                publicProjectId ? `${publicProjectId}.appspot.com` : "",
            ]
                .map(normalizeBucketName)
                .filter((value) => value.length > 0),
        ),
    );
}

export async function POST(req: Request) {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userDoc = await getUserDoc(session.uid);
    if (toAccountType(userDoc?.role ?? null) !== "company") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const tenantId = getShowcaseTenantId(userDoc, session.uid);
    if (!tenantId) return NextResponse.json({ error: "Missing company tenant id" }, { status: 400 });

    let formData: FormData;
    try {
        formData = await req.formData();
    } catch {
        return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }

    const file = formData.get("file");
    if (!(file instanceof File)) {
        return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
        return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
    }
    if (file.size <= 0 || file.size > MAX_UPLOAD_SIZE_BYTES) {
        return NextResponse.json({ error: "Image is too large" }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const token = crypto.randomUUID();
    const ext = sanitizeFileExtension(file.name, file.type);
    const objectPath = `companies/${tenantId}/showcase/services/${Date.now()}-${crypto.randomUUID()}${ext}`;

    const storage = getStorage();
    const bucketCandidates = getBucketCandidates();
    if (bucketCandidates.length === 0) {
        return NextResponse.json(
            {
                error: "No storage bucket configured. Set FIREBASE_STORAGE_BUCKET in .env.local and restart server.",
            },
            { status: 500 },
        );
    }

    let uploadedUrl = "";
    let lastError: unknown = null;
    const attempted: string[] = [];

    for (const bucketName of bucketCandidates) {
        try {
            attempted.push(bucketName);
            const bucket = storage.bucket(bucketName);
            const object = bucket.file(objectPath);
            await object.save(bytes, {
                resumable: false,
                contentType: file.type,
                metadata: {
                    metadata: {
                        firebaseStorageDownloadTokens: token,
                    },
                    cacheControl: "public, max-age=31536000",
                },
            });
            uploadedUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(objectPath)}?alt=media&token=${token}`;
            break;
        } catch (error) {
            lastError = error;
        }
    }

    if (!uploadedUrl) {
        const message = lastError instanceof Error ? lastError.message : "Upload failed";
        const detail = /bucket does not exist/i.test(message)
            ? `Storage bucket not found. Set FIREBASE_STORAGE_BUCKET to an existing bucket and ensure Firebase Storage is enabled. Tried: ${attempted.join(", ")}`
            : message;
        return NextResponse.json({ error: detail }, { status: 500 });
    }

    return NextResponse.json({ ok: true, url: uploadedUrl });
}
