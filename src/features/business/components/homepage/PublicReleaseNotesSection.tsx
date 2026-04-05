import Link from "next/link";
import { ArrowRight, GitCommitHorizontal, History, NotebookTabs } from "lucide-react";
import { SectionShell } from "@/features/business/components/homepage/SectionShell";
import type { PublicReleaseNotes } from "@/features/business/services/publicReleaseNotes.server";

type PublicReleaseNotesSectionProps = {
    lang: "zh" | "en";
    releaseNotes: PublicReleaseNotes;
    showAll?: boolean;
};

function formatIsoForLocale(value: string, lang: "zh" | "en"): string {
    const ts = Date.parse(value);
    if (!Number.isFinite(ts)) return value;
    return new Intl.DateTimeFormat(lang === "en" ? "en-US" : "zh-TW", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(ts));
}

function formatDateForLocale(value: string, lang: "zh" | "en"): string {
    const ts = Date.parse(value);
    if (!Number.isFinite(ts)) return value;
    return new Intl.DateTimeFormat(lang === "en" ? "en-US" : "zh-TW", {
        year: "numeric",
        month: "short",
        day: "numeric",
    }).format(new Date(ts));
}

export function PublicReleaseNotesSection({ lang, releaseNotes, showAll = false }: PublicReleaseNotesSectionProps) {
    const copy =
        lang === "en"
            ? {
                  eyebrow: "Release Notes",
                  title: "Recent updates, visible from the public homepage",
                  description:
                      "This log is sourced from `docs/DOCUMENTATION-VERSION.md`, so updates can ship to the public site together with main-branch changes instead of maintaining a second manual changelog.",
                  latestGit: "Latest Git revision",
                  latestGitFallback: "Git metadata is unavailable in this environment. The version log below still follows the repo documentation record.",
                  currentVersion: "Current version",
                  lastCorrected: "Last corrected",
                  commitSubject: "Latest commit",
                  historyTitle: "Version history",
                  historyHint: "The summary column is maintained in the repo docs and is meant for public-facing update notes.",
                  viewFull: "View full update history",
                  recentCount: "Recent entries",
                  version: "Version",
                  updateDate: "Updated",
                  summary: "What changed",
              }
            : {
                  eyebrow: "版本更新紀錄",
                  title: "公開首頁可直接查看最近更新了什麼",
                  description:
                      "這份紀錄直接讀取 `docs/DOCUMENTATION-VERSION.md`，所以你主分支更新並同步文件後，展示頁也會跟著帶出版本歷史，不需要再維護第二份手寫 changelog。",
                  latestGit: "最新 Git 版本",
                  latestGitFallback: "目前環境讀不到 Git metadata，但下方版本紀錄仍會依 repo 文件歷史顯示。",
                  currentVersion: "目前版本",
                  lastCorrected: "最後更正",
                  commitSubject: "最近提交",
                  historyTitle: "版本歷史",
                  historyHint: "更新摘要直接維護在 repo 文件內，適合作為公開展示頁的更新說明。",
                  viewFull: "查看完整更新紀錄",
                  recentCount: "最近筆數",
                  version: "版本",
                  updateDate: "更新日期",
                  summary: "更新內容",
              };

    const entries = showAll ? releaseNotes.entries : releaseNotes.entries.slice(0, 6);
    const historyHeightClass = showAll ? "max-h-[min(72vh,58rem)]" : "max-h-[min(30rem,55vh)]";

    return (
        <SectionShell id="updates" eyebrow={copy.eyebrow} title={copy.title} description={copy.description} className={showAll ? "pt-10 md:pt-14" : "py-10 md:py-14"}>
            <div className="grid gap-5 xl:grid-cols-[minmax(0,0.86fr)_minmax(0,1.34fr)]">
                <article className="rounded-[2rem] border border-[var(--biz-glass-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.84),rgba(255,255,255,0.72))] p-5 shadow-[0_24px_70px_-52px_rgba(14,62,53,0.42)] backdrop-blur-xl md:p-6">
                    <div className="flex items-start gap-3 text-[var(--biz-accent-ink)]">
                        <span className="mt-0.5 flex h-12 w-12 items-center justify-center rounded-[1.35rem] bg-[var(--biz-chip-bg)]">
                            <GitCommitHorizontal className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--biz-body)]">{copy.latestGit}</p>
                            <h3 className="mt-1 text-[2rem] font-semibold leading-none text-[var(--biz-heading)]">{releaseNotes.currentVersion}</h3>
                        </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                        <div className="rounded-[1.5rem] border border-[var(--biz-border)] bg-[var(--biz-surface)] px-4 py-4">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--biz-body)]">{copy.currentVersion}</div>
                            <div className="mt-2 text-2xl font-semibold text-[var(--biz-heading)]">{releaseNotes.currentVersion}</div>
                        </div>
                        <div className="rounded-[1.5rem] border border-[var(--biz-border)] bg-[var(--biz-surface)] px-4 py-4">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--biz-body)]">{copy.lastCorrected}</div>
                            <div className="mt-2 text-xl font-semibold text-[var(--biz-heading)]">{formatDateForLocale(releaseNotes.lastCorrected, lang)}</div>
                        </div>
                    </div>

                    {releaseNotes.latestGitRevision ? (
                        <div className="mt-4 rounded-[1.5rem] border border-[var(--biz-border)] bg-[var(--biz-surface)] px-4 py-4">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--biz-body)]">{copy.commitSubject}</div>
                            <p className="mt-2 text-base font-semibold leading-snug text-[var(--biz-heading)]">{releaseNotes.latestGitRevision.subject || releaseNotes.latestGitRevision.shortHash}</p>
                            <p className="mt-2 text-sm text-[var(--biz-body)]">
                                {releaseNotes.latestGitRevision.shortHash} · {formatIsoForLocale(releaseNotes.latestGitRevision.committedAt, lang)}
                            </p>
                        </div>
                    ) : (
                        <div className="mt-4 rounded-[1.5rem] border border-dashed border-[var(--biz-border)] bg-[var(--biz-surface-soft)] px-4 py-4 text-sm leading-relaxed text-[var(--biz-body)]">
                            {copy.latestGitFallback}
                        </div>
                    )}
                </article>

                <article className="rounded-[2rem] border border-[var(--biz-glass-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.84),rgba(255,255,255,0.72))] p-5 shadow-[0_24px_70px_-52px_rgba(14,62,53,0.42)] backdrop-blur-xl md:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex min-w-0 items-start gap-3">
                            <span className="mt-0.5 flex h-12 w-12 items-center justify-center rounded-[1.35rem] bg-[var(--biz-chip-bg)] text-[var(--biz-accent-ink)]">
                                <History className="h-5 w-5" />
                            </span>
                            <div className="min-w-0">
                                <h3 className="text-[1.7rem] font-semibold leading-tight text-[var(--biz-heading)]">{copy.historyTitle}</h3>
                                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--biz-body)]">{copy.historyHint}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="rounded-full border border-[var(--biz-border)] bg-[var(--biz-surface)] px-3 py-1 text-xs font-semibold tracking-[0.12em] text-[var(--biz-body)] uppercase">
                                {copy.recentCount} · {entries.length}
                            </span>
                            {!showAll ? (
                                <Link
                                    href="/updates"
                                    className="inline-flex items-center gap-2 rounded-full border border-[var(--biz-border-strong)] px-4 py-2 text-sm font-semibold text-[var(--biz-accent-ink)] transition hover:bg-[var(--biz-surface-soft)]"
                                >
                                    {copy.viewFull}
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            ) : null}
                        </div>
                    </div>

                    <div className="mt-5 rounded-[1.6rem] border border-[var(--biz-border)] bg-[rgba(255,255,255,0.6)] p-2 md:p-3">
                        <div className={`${historyHeightClass} min-w-0 overflow-y-auto pr-1 md:pr-2`}>
                            <div className="grid gap-3">
                                {entries.map((entry) => (
                                    <article
                                        key={entry.version}
                                        className="grid gap-3 rounded-[1.4rem] border border-[var(--biz-border)] bg-[var(--biz-surface)] px-4 py-4 shadow-[0_12px_30px_-24px_rgba(14,62,53,0.28)] md:grid-cols-[140px_160px_minmax(0,1fr)] md:items-start"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--biz-chip-bg)] text-[var(--biz-accent-ink)]">
                                                <NotebookTabs className="h-4 w-4" />
                                            </span>
                                            <div>
                                                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--biz-body)]">{copy.version}</div>
                                                <div className="text-lg font-semibold text-[var(--biz-heading)]">{entry.version}</div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--biz-body)]">{copy.updateDate}</div>
                                            <div className="mt-1 text-sm font-medium text-[var(--biz-heading)]">{formatDateForLocale(entry.date, lang)}</div>
                                        </div>
                                        <div>
                                            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--biz-body)]">{copy.summary}</div>
                                            <p className="mt-1 text-sm leading-7 text-[var(--biz-heading)]">{entry.summary}</p>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </div>
                </article>
            </div>
        </SectionShell>
    );
}
