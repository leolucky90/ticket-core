import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cookies } from "next/headers";
import type { CSSProperties } from "react";
import { PublicReleaseNotesSection } from "@/features/business/components/homepage/PublicReleaseNotesSection";
import { getPublicReleaseNotes } from "@/features/business/services/publicReleaseNotes.server";
import { getUiLanguage } from "@/lib/i18n/ui-text";

export default async function PublicUpdatesPage() {
    const cookieStore = await cookies();
    const lang = getUiLanguage(cookieStore.get("lang")?.value);
    const releaseNotes = await getPublicReleaseNotes();

    return (
        <main
            className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(26,104,93,0.16),_transparent_38%),linear-gradient(180deg,_#f7f1e8_0%,_#f6efe6_42%,_#f3eadf_100%)] pb-16 pt-8 text-[var(--biz-heading)]"
            style={
                {
                    "--biz-heading": "#203835",
                    "--biz-body": "rgba(32,56,53,0.72)",
                    "--biz-accent-ink": "#1b7265",
                    "--biz-chip-bg": "rgba(27,114,101,0.12)",
                    "--biz-border": "rgba(32,56,53,0.16)",
                    "--biz-border-strong": "rgba(27,114,101,0.36)",
                    "--biz-surface": "rgba(255,255,255,0.72)",
                    "--biz-surface-soft": "rgba(255,255,255,0.56)",
                    "--biz-glass": "rgba(255,255,255,0.78)",
                    "--biz-glass-border": "rgba(255,255,255,0.55)",
                } as CSSProperties
            }
        >
            <div className="mx-auto flex w-full max-w-6xl px-4 md:px-6">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--biz-border-strong)] bg-[var(--biz-surface)] px-4 py-2 text-sm font-semibold text-[var(--biz-accent-ink)] transition hover:bg-[var(--biz-surface-soft)]"
                >
                    <ArrowLeft className="h-4 w-4" />
                    {lang === "en" ? "Back Home" : "返回首頁"}
                </Link>
            </div>

            <PublicReleaseNotesSection lang={lang} releaseNotes={releaseNotes} showAll />
        </main>
    );
}
