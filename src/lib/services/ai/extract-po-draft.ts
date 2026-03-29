import "server-only";
import OpenAI from "openai";
import { poDraftSchema, type PoDraft } from "@/lib/schema/ai/po-draft";

const EXTRACTION_SYSTEM = `You extract a structured purchase-order *draft* from noisy OCR text of a receipt or invoice.
Rules:
- Output a single JSON object only. No markdown.
- documentType: "receipt" | "invoice" | "unknown" (best guess from wording/layout).
- vendorName: merchant name if visible, else null.
- documentNumber, documentDate (ISO-like or as printed), currency code if visible.
- Numbers may be null if missing or unreadable.
- items: each line with description (required), qty, unitPrice, amount (nullable when unknown).
- warnings: short strings for ambiguities, missing totals, illegible sections.
- confidence: 0–1 how trustworthy the extraction is given OCR quality.
- rawSummary: 2–4 sentences in the same language as the document, summarizing what you understood.
- Never invent large totals; prefer null with a warning.
`;

function getOpenAI(): OpenAI {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error("Missing OPENAI_API_KEY");
    }
    return new OpenAI({ apiKey });
}

function normalizeParsed(raw: unknown): PoDraft {
    const base = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};
    const itemsRaw = Array.isArray(base.items) ? base.items : [];
    const items = itemsRaw.map((row) => {
        const r = typeof row === "object" && row !== null ? (row as Record<string, unknown>) : {};
        const description =
            typeof r.description === "string" && r.description.trim().length > 0
                ? r.description.trim()
                : "（未命名品項）";
        const numField = (v: unknown): number | null =>
            typeof v === "number" && Number.isFinite(v) ? v : null;
        return {
            description,
            qty: numField(r.qty),
            unitPrice: numField(r.unitPrice),
            amount: numField(r.amount),
            productId: null,
            sku: null,
            nameEntryHint: null,
        };
    });

    const docType = base.documentType;
    const documentType =
        docType === "invoice" || docType === "receipt" || docType === "unknown" ? docType : "unknown";

    const str = (v: unknown): string | null => (typeof v === "string" ? v : null);
    const num = (v: unknown): number | null =>
        typeof v === "number" && Number.isFinite(v) ? v : null;

    const warnings = Array.isArray(base.warnings)
        ? base.warnings.filter((w): w is string => typeof w === "string")
        : [];

    const confidence =
        typeof base.confidence === "number" && Number.isFinite(base.confidence)
            ? Math.min(1, Math.max(0, base.confidence))
            : 0.5;

    const rawSummary =
        typeof base.rawSummary === "string" && base.rawSummary.trim().length > 0
            ? base.rawSummary.trim()
            : "（無摘要）";

    const candidate: PoDraft = {
        documentType,
        vendorName: str(base.vendorName),
        documentNumber: str(base.documentNumber),
        documentDate: str(base.documentDate),
        currency: str(base.currency),
        subtotal: num(base.subtotal),
        tax: num(base.tax),
        total: num(base.total),
        items: items.length > 0
            ? items
            : [
                  {
                      description: "（未辨識品項）",
                      qty: null,
                      unitPrice: null,
                      amount: null,
                      productId: null,
                      sku: null,
                      nameEntryHint: null,
                  },
              ],
        warnings,
        confidence,
        rawSummary,
    };

    const parsed = poDraftSchema.safeParse(candidate);
    if (parsed.success) return parsed.data;
    return poDraftSchema.parse({
        ...candidate,
        items: [
            {
                description: "（解析失敗）",
                qty: null,
                unitPrice: null,
                amount: null,
                productId: null,
                sku: null,
                nameEntryHint: null,
            },
        ],
        warnings: [...warnings, "結構驗證失敗，已套用最小欄位。"],
        confidence: Math.min(confidence, 0.3),
    });
}

export async function extractPoDraft(rawText: string): Promise<PoDraft> {
    const openai = getOpenAI();
    const model = process.env.OPENAI_PO_MODEL?.trim() || "gpt-4o-mini";

    const res = await openai.chat.completions.create({
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
            { role: "system", content: EXTRACTION_SYSTEM },
            {
                role: "user",
                content: `OCR text:\n${rawText.slice(0, 48_000)}`,
            },
        ],
    });

    const text = res.choices[0]?.message?.content ?? "{}";
    let parsedJson: unknown;
    try {
        parsedJson = JSON.parse(text) as unknown;
    } catch {
        return normalizeParsed({});
    }

    return normalizeParsed(parsedJson);
}
