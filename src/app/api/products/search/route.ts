import { NextResponse } from "next/server";
import { requireMerchantDocumentIntakeSession } from "@/lib/services/documents/document-intake-session";
import { searchProductsForPoDraft } from "@/lib/services/merchant/po-draft-product-search.service";

export async function GET(req: Request) {
    const session = await requireMerchantDocumentIntakeSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim() ?? "";
    const limitRaw = url.searchParams.get("limit");
    const limit = Number.isFinite(Number(limitRaw)) ? Math.round(Number(limitRaw)) : 12;
    const categoryId = url.searchParams.get("categoryId")?.trim() ?? "";
    const brandId = url.searchParams.get("brandId")?.trim() ?? "";
    const modelId = url.searchParams.get("modelId")?.trim() ?? "";
    const nameEntryHint = url.searchParams.get("nameEntryHint")?.trim() ?? "";

    const dimensions =
        categoryId || brandId || modelId
            ? {
                  categoryId: categoryId || undefined,
                  brandId: brandId || undefined,
                  modelId: modelId || undefined,
              }
            : undefined;

    try {
        const products = await searchProductsForPoDraft({
            query: q,
            limit,
            dimensions,
            nameEntryHint: nameEntryHint || undefined,
        });
        return NextResponse.json({ ok: true, products });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Search failed";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
