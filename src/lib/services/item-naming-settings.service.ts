import "server-only";
import { revalidatePath } from "next/cache";
import { fbAdminDb } from "@/lib/firebase-server";
import { normalizeItemNamingSettings, itemNamingSettingsDocPath, type ItemNamingSettings } from "@/lib/schema/itemNamingSettings";
import { appendStructuredProductNameSuffix, buildConfiguredProductName, buildProductNormalizedName, parseProductNamingMode } from "@/lib/services/productNaming";
import { requireCompanyOperator } from "@/lib/services/access-control";
import type { ItemNamingToken } from "@/lib/types/catalog";

function toText(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
}

async function syncStructuredProductNamesByNamingOrder(companyId: string, namingOrder: ItemNamingToken[]): Promise<void> {
    const productsRef = fbAdminDb.collection(`companies/${companyId}/products`);
    const snap = await productsRef.get();
    if (snap.empty) return;

    let batch = fbAdminDb.batch();
    let pendingWrites = 0;
    const nowTs = Date.now();

    for (const doc of snap.docs) {
        const row = doc.data() as Record<string, unknown>;
        const namingMode = parseProductNamingMode(row.namingMode);
        if (namingMode === "custom") continue;

        const baseName = buildConfiguredProductName({
            categoryName: toText(row.categoryName),
            secondaryCategoryName: toText(row.secondaryCategoryName),
            tertiaryCategoryName: toText(row.tertiaryCategoryName),
            brandName: toText(row.brandName),
            productTypeName: toText(row.productTypeName),
            modelName: toText(row.modelName),
            namingOrder,
        });
        const nextName = appendStructuredProductNameSuffix(baseName, toText(row.customLabel));
        if (!nextName) continue;

        const nextNormalizedName = buildProductNormalizedName({
            name: nextName,
            aliases: row.aliases,
            categoryName: toText(row.categoryName),
            secondaryCategoryName: toText(row.secondaryCategoryName),
            tertiaryCategoryName: toText(row.tertiaryCategoryName),
            brandName: toText(row.brandName),
            productTypeName: toText(row.productTypeName),
            modelName: toText(row.modelName),
            nameEntryName: toText(row.nameEntryName),
            customLabel: toText(row.customLabel),
        });
        const currentName = toText(row.name);
        const currentNormalizedName = toText(row.normalizedName);
        if (currentName === nextName && currentNormalizedName === nextNormalizedName) continue;

        batch.set(
            doc.ref,
            {
                name: nextName,
                normalizedName: nextNormalizedName,
                updatedAt: nowTs,
            },
            { merge: true },
        );
        pendingWrites += 1;

        if (pendingWrites >= 400) {
            await batch.commit();
            batch = fbAdminDb.batch();
            pendingWrites = 0;
        }
    }

    if (pendingWrites > 0) {
        await batch.commit();
    }
}

export async function getItemNamingSettings(companyIdInput?: string): Promise<ItemNamingSettings> {
    const operator = await requireCompanyOperator();
    const companyId = companyIdInput?.trim() || operator.companyId!;
    const path = itemNamingSettingsDocPath(companyId);
    const snap = await fbAdminDb.doc(path).get();
    const settings = normalizeItemNamingSettings(snap.exists ? (snap.data() as Partial<ItemNamingSettings>) : null, operator.uid);
    if (!snap.exists) {
        await fbAdminDb.doc(path).set(settings, { merge: true });
    }
    return settings;
}

export async function updateItemNamingSettings(input: {
    companyId?: string;
    patch: Partial<ItemNamingSettings>;
}): Promise<ItemNamingSettings> {
    const operator = await requireCompanyOperator();
    const companyId = input.companyId?.trim() || operator.companyId!;
    const current = await getItemNamingSettings(companyId);
    const next = normalizeItemNamingSettings(
        {
            ...current,
            ...input.patch,
            updatedAt: new Date().toISOString(),
            updatedBy: operator.uid,
        },
        operator.uid,
    );
    await fbAdminDb.doc(itemNamingSettingsDocPath(companyId)).set(next, { merge: true });
    await syncStructuredProductNamesByNamingOrder(companyId, next.order);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/products");
    return next;
}
