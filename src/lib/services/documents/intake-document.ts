import "server-only";
import { extractPoDraft } from "@/lib/services/ai/extract-po-draft";
import { runGoogleVisionOcr } from "@/lib/services/ocr/google-vision-ocr";

export async function intakeDocument(buffer: Buffer) {
    const text = await runGoogleVisionOcr(buffer);
    const draft = await extractPoDraft(text);

    return { text, draft };
}
