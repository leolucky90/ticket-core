/**
 * 分店（Store）：掛在 company 下的營運據點；倉庫隸屬分店。
 * Canonical DB field：companyId（見 project-rules）。
 */

export const MERCHANT_STORE_STATUSES = ["active", "inactive"] as const;

export type MerchantStoreStatus = (typeof MERCHANT_STORE_STATUSES)[number];

export type MerchantStore = {
    id: string;
    companyId: string;
    name: string;
    status: MerchantStoreStatus;
};

function toText(value: unknown, max = 240): string {
    if (typeof value !== "string") return "";
    return value.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, max);
}

function toStatus(value: unknown): MerchantStoreStatus {
    return value === "inactive" ? "inactive" : "active";
}

export function storesCollectionPath(companyId: string): string {
    return `companies/${toText(companyId, 120)}/stores`;
}

export function normalizeMerchantStore(
    input: Partial<MerchantStore> & Pick<MerchantStore, "id" | "companyId">,
): MerchantStore {
    return {
        id: toText(input.id, 120),
        companyId: toText(input.companyId, 120),
        name: toText(input.name) || "Store",
        status: toStatus(input.status),
    };
}
