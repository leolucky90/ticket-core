import { Archive, Eye, Pencil, Plus, Search, Store, Wrench } from "lucide-react";
import { MerchantListShell, MerchantSectionCard, SearchToolbar } from "@/components/merchant/shell";
import { MerchantPredictiveSearchInput } from "@/components/merchant/search";
import { IconActionButton } from "@/components/ui/icon-action-button";
import { IconTextActionButton } from "@/components/ui/icon-text-action-button";
import { Select } from "@/components/ui/select";
import { UsedProductStatusBadge } from "@/components/used-products/used-product-status-badge";
import type { UsedProduct } from "@/lib/schema";

type UsedProductsManagementPanelProps = {
    products: UsedProduct[];
    keyword: string;
    saleStatus: string;
    refurbishmentStatus: string;
    publishAction: (formData: FormData) => Promise<void>;
    unpublishAction: (formData: FormData) => Promise<void>;
    createRefurbishmentCaseAction: (formData: FormData) => Promise<void>;
};

function formatMoney(value: number | undefined): string {
    return new Intl.NumberFormat("zh-TW").format(Math.max(0, value ?? 0));
}

function formatDate(value: string): string {
    const ts = Date.parse(value);
    if (!Number.isFinite(ts)) return "-";
    return new Intl.DateTimeFormat("zh-TW", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).format(ts);
}

export function UsedProductsManagementPanel({
    products,
    keyword,
    saleStatus,
    refurbishmentStatus,
    publishAction,
    unpublishAction,
    createRefurbishmentCaseAction,
}: UsedProductsManagementPanelProps) {
    const productSuggestions = products.map((product) => ({
        id: product.id,
        value: product.name,
        title: product.name,
        subtitle: [product.brand, product.model, product.serialNumber || product.imeiNumber].filter(Boolean).join(" / ") || undefined,
        keywords: [product.name, product.brand, product.model, product.type, product.serialNumber, product.imeiNumber, product.gradeLabel].filter(
            (value): value is string => Boolean(value),
        ),
    }));

    const toolbar = (
        <SearchToolbar
            searchSlot={
                <form action="/products/used" method="get" className="grid gap-2 md:grid-cols-[1fr_auto_auto_auto]">
                    <MerchantPredictiveSearchInput
                        name="q"
                        defaultValue={keyword}
                        placeholder="搜尋名稱、品牌、型號、序列號、IMEI、等級"
                        localSuggestions={productSuggestions}
                    />
                    <Select name="saleStatus" defaultValue={saleStatus}>
                        <option value="">全部銷售狀態</option>
                        <option value="draft">draft</option>
                        <option value="purchased">purchased</option>
                        <option value="inspecting">inspecting</option>
                        <option value="available">available</option>
                        <option value="reserved">reserved</option>
                        <option value="sold">sold</option>
                        <option value="returned">returned</option>
                        <option value="archived">archived</option>
                    </Select>
                    <Select name="refurbishmentStatus" defaultValue={refurbishmentStatus}>
                        <option value="">全部翻新狀態</option>
                        <option value="waiting_refurbishment">等待翻新</option>
                        <option value="no_need_refurbishment">不須翻新</option>
                        <option value="refurbishing">翻新中</option>
                        <option value="refurbished">已翻新</option>
                    </Select>
                    <div className="flex items-center gap-2">
                        <IconActionButton icon={Search} type="submit" label="搜尋" tooltip="搜尋二手商品" />
                        <IconActionButton href="/products/used" icon={Archive} label="重置篩選" tooltip="重置篩選" />
                    </div>
                </form>
            }
            primaryActionSlot={<IconTextActionButton icon={Plus} href="/products/used/new" label="新增二手商品" tooltip="新增二手商品" />}
        />
    );

    const list = (
        <MerchantSectionCard
            title="二手商品清單"
            description={`共 ${products.length} 筆`}
            emptyState={
                products.length === 0
                    ? {
                          icon: Search,
                          title: "找不到符合條件的二手商品",
                          description: "調整搜尋或篩選條件後再試，或先建立新的二手商品資料。",
                      }
                    : undefined
            }
        >
            {products.length === 0 ? null : (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1280px] text-sm">
                        <thead className="bg-[rgb(var(--panel2))] text-[rgb(var(--muted))]">
                            <tr>
                                <th className="px-2 py-2 text-left font-medium">商品名稱</th>
                                <th className="px-2 py-2 text-left font-medium">品牌</th>
                                <th className="px-2 py-2 text-left font-medium">型號</th>
                                <th className="px-2 py-2 text-left font-medium">類型</th>
                                <th className="px-2 py-2 text-left font-medium">序列號/IMEI No</th>
                                <th className="px-2 py-2 text-left font-medium">狀態</th>
                                <th className="px-2 py-2 text-left font-medium">售價</th>
                                <th className="px-2 py-2 text-left font-medium">保固</th>
                                <th className="px-2 py-2 text-left font-medium">建立時間</th>
                                <th className="px-2 py-2 text-left font-medium">操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((item) => (
                                <tr key={item.id} className="border-t border-[rgb(var(--border))] align-top">
                                    <td className="px-2 py-2">
                                        <div className="font-medium">{item.name}</div>
                                        {item.specifications ? <div className="text-xs text-[rgb(var(--muted))]">{item.specifications}</div> : null}
                                    </td>
                                    <td className="px-2 py-2">{item.brand || "-"}</td>
                                    <td className="px-2 py-2">{item.model || "-"}</td>
                                    <td className="px-2 py-2">{item.type || "-"}</td>
                                    <td className="px-2 py-2">{item.serialNumber || item.imeiNumber || "-"}</td>
                                    <td className="px-2 py-2">
                                        <UsedProductStatusBadge
                                            product={{
                                                grade: item.grade,
                                                gradeLabel: item.gradeLabel,
                                                isRefurbished: item.isRefurbished,
                                                refurbishmentStatus: item.refurbishmentStatus,
                                                saleStatus: item.saleStatus,
                                            }}
                                        />
                                    </td>
                                    <td className="px-2 py-2">{formatMoney(item.salePrice ?? item.suggestedSalePrice)}</td>
                                    <td className="px-2 py-2">
                                        {item.warrantyEnabled ? `${item.warrantyDuration} ${item.warrantyUnit}` : "未啟用"}
                                    </td>
                                    <td className="px-2 py-2">{formatDate(item.createdAt)}</td>
                                    <td className="px-2 py-2">
                                        <div className="flex flex-wrap gap-1">
                                            <IconActionButton href={`/products/used/${encodeURIComponent(item.id)}`} icon={Eye} label="查看明細" tooltip="查看明細" />
                                            <IconActionButton href={`/products/used/${encodeURIComponent(item.id)}/edit`} icon={Pencil} label="編輯商品" tooltip="編輯商品" />
                                            <form action={createRefurbishmentCaseAction}>
                                                <input type="hidden" name="usedProductId" value={item.id} />
                                                <IconActionButton icon={Wrench} type="submit" label="翻新" tooltip="建立或連結翻新案件" />
                                            </form>
                                            {item.isPublished ? (
                                                <form action={unpublishAction}>
                                                    <input type="hidden" name="id" value={item.id} />
                                                    <IconActionButton icon={Archive} type="submit" label="下架" tooltip="下架商品" />
                                                </form>
                                            ) : (
                                                <form action={publishAction}>
                                                    <input type="hidden" name="id" value={item.id} />
                                                    <IconActionButton icon={Store} type="submit" label="上架" tooltip="上架銷售" />
                                                </form>
                                            )}
                                            <IconActionButton
                                                href={`/dashboard/checkout?usedProductId=${encodeURIComponent(item.id)}`}
                                                icon={Store}
                                                label="進入銷售"
                                                tooltip="進入銷售流程"
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </MerchantSectionCard>
    );

    return (
        <MerchantListShell toolbar={toolbar} list={list} />
    );
}
