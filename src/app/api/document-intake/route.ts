import { NextResponse } from "next/server";
import { intakeDocument } from "@/lib/services/documents/intake-document";
import { requireMerchantDocumentIntakeSession } from "@/lib/services/documents/document-intake-session";
import { saveDocumentIntake } from "@/lib/services/documents/save-document";

const MAX_BYTES = 12 * 1024 * 1024;

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(req: Request) {
    const session = await requireMerchantDocumentIntakeSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const form = await req.formData();
    const file = form.get("file");
    if (!file || typeof file !== "object" || !("arrayBuffer" in file)) {
        return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    const upload = file as File;
    const mimeType = upload.type || "application/octet-stream";
    if (!ALLOWED.has(mimeType)) {
        return NextResponse.json(
            { error: "Only image uploads are supported (JPEG, PNG, WebP, GIF). PDF is not supported yet." },
            { status: 400 },
        );
    }

    const buffer = Buffer.from(await upload.arrayBuffer());
    if (buffer.length === 0) {
        return NextResponse.json({ error: "Empty file" }, { status: 400 });
    }
    if (buffer.length > MAX_BYTES) {
        return NextResponse.json({ error: "File too large" }, { status: 400 });
    }

    try {
        const { text, draft } = await intakeDocument(buffer);
        const saved = await saveDocumentIntake({
            companyId: session.companyId,
            fileName: upload.name || "upload",
            mimeType,
            ocrText: text,
            draft,
        });

        return NextResponse.json({
            ...saved,
            draft,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Intake failed";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
