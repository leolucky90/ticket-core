import "server-only";

import OpenAI from "openai";

function getOpenAI(): OpenAI {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error("Missing OPENAI_API_KEY");
    }
    return new OpenAI({ apiKey });
}

function parseNonNegativeInt(raw: string): number | null {
    const m = raw.match(/-?\d+/);
    if (!m) return null;
    const n = parseInt(m[0], 10);
    return Number.isFinite(n) && n >= 0 ? n : null;
}

/**
 * 依近 30 日銷量與現庫存產生補貨建議數量（僅建議，不寫入庫存）。
 * 模型預設 gpt-4o-mini，可選 OPENAI_REORDER_MODEL。
 */
export async function generateReorderSuggestion(data: {
    productName: string;
    sales30d: number;
    currentStock: number;
}): Promise<number | null> {
    const model = process.env.OPENAI_REORDER_MODEL ?? "gpt-4o-mini";
    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
        model,
        messages: [
            {
                role: "system",
                content:
                    "You output a single non-negative integer only: suggested reorder quantity. No words, no units, no explanation.",
            },
            {
                role: "user",
                content: `Product: ${data.productName}\nSales (30 days): ${data.sales30d}\nCurrent stock: ${data.currentStock}\nSuggest reorder quantity.`,
            },
        ],
        max_completion_tokens: 16,
        temperature: 0.2,
    });

    const text = completion.choices[0]?.message?.content?.trim() ?? "";
    return parseNonNegativeInt(text);
}
