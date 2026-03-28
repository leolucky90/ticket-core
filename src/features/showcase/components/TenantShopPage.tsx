import Link from "next/link";
import type { CSSProperties } from "react";
import { SignOutButton } from "@/components/layout/SignOutButton";
import type { Product } from "@/lib/types/merchant-product";
import type { ShowThemeColors, StorefrontSettings } from "@/features/showcase/types/showTheme";

function formatMoney(value: number, lang: "zh" | "en") {
    const locale = lang === "zh" ? "zh-TW" : "en-US";
    return new Intl.NumberFormat(locale).format(value);
}

export function TenantShopPage({
    tenantId,
    lang,
    products,
    showThemeColors,
    storefrontSettings,
    navAccountType,
}: {
    tenantId: string;
    lang: "zh" | "en";
    products: Product[];
    showThemeColors: ShowThemeColors;
    storefrontSettings: StorefrontSettings;
    navAccountType: "guest" | "company" | "customer";
}) {
    const vars: CSSProperties = {
        ["--shop-page-bg" as string]: showThemeColors.shopPage,
        ["--shop-header-bg" as string]: showThemeColors.shopHeader,
        ["--shop-hero-bg" as string]: showThemeColors.shopHero,
        ["--shop-grid-bg" as string]: showThemeColors.shopGrid,
        ["--shop-footer-bg" as string]: showThemeColors.shopFooter,
    };

    const dashboardHref = `/${encodeURIComponent(tenantId)}/dashboard`;
    const homeHref = `/${encodeURIComponent(tenantId)}`;
    const merchantDashboardHref = "/dashboard";

    if (!storefrontSettings.shoppingEnabled) {
        return (
            <div className="min-h-dvh bg-[rgb(var(--bg))] p-6 text-[rgb(var(--text))]">
                <div className="mx-auto max-w-4xl rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--panel))] p-6">
                    <h1 className="text-xl font-semibold">{lang === "en" ? "Shop is disabled" : "線上購物尚未開啟"}</h1>
                    <p className="mt-2 text-sm text-[rgb(var(--muted))]">
                        {lang === "en" ? "Please contact the company administrator." : "請聯繫公司管理員開啟購物功能。"}
                    </p>
                    <Link href={homeHref} className="mt-4 inline-flex rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-sm">
                        {lang === "en" ? "Back Home" : "返回首頁"}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div
            className="min-h-dvh bg-[rgb(var(--shop-page-bg))] text-[#191815] [font-family:'Montserrat','Noto_Sans_TC',sans-serif]"
            style={vars}
        >
            <header className="sticky top-0 z-20 border-b border-[#1d1b16] bg-[rgb(var(--shop-header-bg))] text-[#f5f1df]">
                <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-4 md:px-6">
                    <Link href={homeHref} className="text-sm font-black uppercase tracking-[0.16em] text-[#ffcb2d]">
                        SHOP
                    </Link>
                    <nav className="flex items-center gap-2 text-xs font-semibold tracking-[0.08em] md:text-sm">
                        <Link className="rounded-full border border-[#ffcb2d] px-3 py-1.5 text-[#ffcb2d] hover:bg-[#ffcb2d] hover:text-[#191815]" href={homeHref}>
                            {lang === "en" ? "Home" : "首頁"}
                        </Link>
                        {navAccountType === "customer" ? (
                            <>
                                <Link className="rounded-full bg-[#ffcb2d] px-3 py-1.5 text-[#191815]" href={dashboardHref}>
                                    {lang === "en" ? "My Dashboard" : "客戶儀錶板"}
                                </Link>
                                <SignOutButton
                                    className="rounded-full border-[#ffcb2d] bg-transparent px-3 py-1.5 text-[#ffcb2d] hover:border-[#ffcb2d] hover:bg-[#ffcb2d] hover:text-[#191815]"
                                    label={lang === "en" ? "Sign out" : "登出"}
                                />
                            </>
                        ) : null}
                        {navAccountType === "company" ? (
                            <>
                                <Link className="rounded-full bg-[#ffcb2d] px-3 py-1.5 text-[#191815]" href={merchantDashboardHref}>
                                    {lang === "en" ? "Dashboard" : "儀錶板"}
                                </Link>
                                <SignOutButton
                                    className="rounded-full border-[#ffcb2d] bg-transparent px-3 py-1.5 text-[#ffcb2d] hover:border-[#ffcb2d] hover:bg-[#ffcb2d] hover:text-[#191815]"
                                    label={lang === "en" ? "Sign out" : "登出"}
                                />
                            </>
                        ) : null}
                        {navAccountType === "guest" ? (
                            <Link className="rounded-full bg-[#ffcb2d] px-3 py-1.5 text-[#191815]" href={`/login?tenant=${encodeURIComponent(tenantId)}`}>
                                {lang === "en" ? "Login" : "登入"}
                            </Link>
                        ) : null}
                    </nav>
                </div>
            </header>

            <main>
                <section className="border-b border-[#1d1b16]/30 bg-[rgb(var(--shop-hero-bg))]">
                    <div className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-12 md:px-6 md:py-14">
                        <h1 className="text-4xl font-black tracking-[0.08em] text-[#191815]">
                            {lang === "en" ? "Online Shopping" : "線上購物"}
                        </h1>
                        <p className="max-w-2xl text-sm font-medium text-[#2c2a24] md:text-base">
                            {lang === "en"
                                ? "Inspired by Crazyparts style and aligned with your company homepage color settings."
                                : "參考 Crazyparts 風格，並沿用公司首頁色彩設定。"}
                        </p>
                    </div>
                </section>

                <section className="bg-[rgb(var(--shop-grid-bg))] py-10 md:py-12">
                    <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-2xl font-black text-[#191815]">{lang === "en" ? "Products" : "商品列表"}</h2>
                            <div className="text-sm text-[#4b473a]">{products.length} {lang === "en" ? "items" : "件商品"}</div>
                        </div>
                        {products.length === 0 ? (
                            <div className="rounded-2xl border-2 border-dashed border-[#1d1b16]/30 bg-white p-8 text-sm text-[#5f5a4b]">
                                {lang === "en" ? "No products yet." : "目前尚無商品，請至公司儀錶板新增產品。"}
                            </div>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {products.map((product) => (
                                    <article key={product.id} className="rounded-2xl border-2 border-[#1d1b16] bg-white p-5">
                                        <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[#5f5a4b]">SKU {product.sku || "-"}</div>
                                        <h3 className="mt-2 text-xl font-black text-[#191815]">{product.name}</h3>
                                        <div className="mt-1 text-sm text-[#4b473a]">{product.supplier || (lang === "en" ? "Supplier TBD" : "供應商待補")}</div>
                                        <div className="mt-4 flex items-end justify-between">
                                            <div className="text-2xl font-black text-[#191815]">NT$ {formatMoney(product.price, lang)}</div>
                                            <div className="text-xs text-[#5f5a4b]">{lang === "en" ? "Stock" : "庫存"}: {product.stock}</div>
                                        </div>
                                        <button
                                            type="button"
                                            className="mt-4 w-full rounded-full bg-[#191815] px-4 py-2 text-sm font-semibold text-[#ffcb2d] hover:bg-black"
                                        >
                                            {lang === "en" ? "Add to Cart" : "加入購物車"}
                                        </button>
                                    </article>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </main>

            <footer className="border-t border-[#1d1b16] bg-[rgb(var(--shop-footer-bg))] py-6 text-center text-sm font-semibold tracking-[0.08em] text-[#f5f1df]">
                {lang === "en" ? "Company Storefront" : "公司線上商店"}
            </footer>
        </div>
    );
}
