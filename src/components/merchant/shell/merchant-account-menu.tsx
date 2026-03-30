import Link from "next/link";
import type { ReactNode } from "react";
import { AiChatBallMenuToggle } from "@/components/ai/ai-chat-ball-menu-toggle";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import type { MerchantTopbarLink } from "@/components/merchant/shell/merchant-shell.types";
import { getUiText } from "@/lib/i18n/ui-text";

type MerchantAccountMenuProps = {
    accountName: string;
    accountEmail?: string;
    avatarText: string;
    currentLang?: "zh" | "en";
    settingsLabel?: string;
    settingsLinks?: MerchantTopbarLink[];
    quickLinks?: MerchantTopbarLink[];
    /** 商家後台：顯示與語言切換同風格之 AI 小球開關（取代下拉內「首頁」連結位置） */
    aiChatBallMenu?: { enabled: boolean } | null;
    signOutSlot?: ReactNode;
};

const MENU_LINK_CLASS =
    "block w-full rounded-md px-2 py-1.5 text-left text-sm leading-snug break-words hover:bg-[rgb(var(--panel))]";

function renderMenuLink(link: MerchantTopbarLink) {
    if (link.external) {
        return (
            <a key={link.id} href={link.href} className={MENU_LINK_CLASS}>
                {link.label}
            </a>
        );
    }

    return (
        <Link key={link.id} href={link.href} className={MENU_LINK_CLASS}>
            {link.label}
        </Link>
    );
}

export function MerchantAccountMenu({
    accountName,
    accountEmail,
    avatarText,
    currentLang,
    settingsLabel,
    settingsLinks = [],
    quickLinks = [],
    aiChatBallMenu = null,
    signOutSlot,
}: MerchantAccountMenuProps) {
    const resolvedSettingsLabel = settingsLabel ?? getUiText(currentLang ?? "zh").shell.settingsMenuShort;
    const menuUi = currentLang ? getUiText(currentLang).chatBallPreference : null;

    return (
        <details className="group relative overflow-visible">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--panel))] px-2 py-1.5 hover:border-[rgb(var(--accent))] [&::-webkit-details-marker]:hidden">
                <span className="grid h-7 w-7 place-items-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] text-xs font-semibold">
                    {avatarText}
                </span>
                <span className="hidden text-sm sm:block">{accountName}</span>
                <span className="text-xs text-[rgb(var(--muted))]">▼</span>
            </summary>
            <div className="absolute right-0 z-[60] mt-2 min-w-[17rem] w-[min(22rem,calc(100vw-2rem))] overflow-visible rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel))] p-3 shadow-lg">
                <div className="space-y-1 border-b border-[rgb(var(--border))] pb-2">
                    <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-semibold">{accountName}</div>
                        {currentLang ? <LanguageSwitcher currentLang={currentLang} /> : null}
                    </div>
                    {accountEmail ? <div className="truncate text-xs text-[rgb(var(--muted))]">{accountEmail}</div> : null}
                </div>
                <div className="mt-2 grid gap-2">
                    {settingsLinks.length > 0 ? (
                        <div className="rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--panel2))]">
                            <div className="border-b border-[rgb(var(--border))] px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                                {resolvedSettingsLabel}
                            </div>
                            <nav className="flex max-h-[min(50vh,22rem)] flex-col gap-0.5 overflow-y-auto overflow-x-hidden p-1.5" aria-label={resolvedSettingsLabel}>
                                {settingsLinks.map((link) => renderMenuLink(link))}
                            </nav>
                        </div>
                    ) : null}
                    {aiChatBallMenu && menuUi ? (
                        <div className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5">
                            <span className="text-sm text-[rgb(var(--text))]">{menuUi.menuRowLabel}</span>
                            <AiChatBallMenuToggle initialEnabled={aiChatBallMenu.enabled} />
                        </div>
                    ) : null}
                    {quickLinks.map((link) => renderMenuLink(link))}
                    {signOutSlot}
                </div>
            </div>
        </details>
    );
}
