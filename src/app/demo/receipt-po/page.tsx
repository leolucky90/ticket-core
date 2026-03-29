import { cookies } from "next/headers";
import { ReceiptPoForm } from "@/components/feature/receipt-po/receipt-po-form";
import { getCatalogDimensionBundle } from "@/lib/services/merchant/catalog-service";

export default async function ReceiptPoDemoPage() {
    const cookieStore = await cookies();
    const langCookie = cookieStore.get("lang")?.value;
    const lang: "zh" | "en" = langCookie === "en" ? "en" : "zh";

    const title = lang === "zh" ? "收據 → OCR → AI 草稿（Demo）" : "Receipt → OCR → AI draft (demo)";
    const subtitle =
        lang === "zh"
            ? "需登入商家帳號以呼叫 API。此頁用於驗證整段流程。"
            : "Sign in as a merchant to call the API. Use this page to validate the flow.";

    const dimensionBundle = await getCatalogDimensionBundle();

    return (
        <main className="min-h-screen bg-[rgb(var(--bg))] px-4 py-10 text-[rgb(var(--text))]">
            <div className="mx-auto max-w-3xl space-y-2 pb-6">
                <h1 className="text-2xl font-semibold">{title}</h1>
                <p className="text-sm text-[rgb(var(--muted))]">{subtitle}</p>
            </div>
            <ReceiptPoForm lang={lang} dimensionBundle={dimensionBundle} />
        </main>
    );
}
