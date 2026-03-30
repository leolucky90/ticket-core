import { cookies } from "next/headers";
import { ReceiptPoForm } from "@/components/feature/receipt-po/receipt-po-form";
import { getUiLanguage, getUiText } from "@/lib/i18n/ui-text";
import { getCatalogDimensionBundle } from "@/lib/services/merchant/catalog-service";

export default async function ReceiptPoDemoPage() {
    const cookieStore = await cookies();
    const lang = getUiLanguage(cookieStore.get("lang")?.value);
    const demoUi = getUiText(lang).receiptPoDemo;

    const dimensionBundle = await getCatalogDimensionBundle();

    return (
        <main className="min-h-screen bg-[rgb(var(--bg))] px-4 py-10 text-[rgb(var(--text))]">
            <div className="mx-auto max-w-3xl space-y-2 pb-6">
                <h1 className="text-2xl font-semibold">{demoUi.title}</h1>
                <p className="text-sm text-[rgb(var(--muted))]">{demoUi.subtitle}</p>
            </div>
            <ReceiptPoForm lang={lang} dimensionBundle={dimensionBundle} />
        </main>
    );
}
