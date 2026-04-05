import "server-only";

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { promises as fs } from "node:fs";
import path from "node:path";

export type PublicReleaseEntry = {
    version: string;
    date: string;
    summary: string;
};

export type PublicGitRevisionMeta = {
    committedAt: string;
    shortHash: string;
    subject: string;
};

export type PublicReleaseNotes = {
    currentVersion: string;
    lastCorrected: string;
    entries: PublicReleaseEntry[];
    latestGitRevision: PublicGitRevisionMeta | null;
};

const execFileAsync = promisify(execFile);
const DOC_PATH = path.join(process.cwd(), "docs", "DOCUMENTATION-VERSION.md");
const CURRENT_VERSION_PATTERN = /\|\s*\*\*版本\*\*\s*\|\s*\*\*(V\d+\.\d+)\*\*\s*\|/;
const LAST_CORRECTED_PATTERN = /\|\s*\*\*最後更正\*\*\s*\|\s*\*\*(\d{4}-\d{2}-\d{2})\*\*\s*\|/;
const CHANGELOG_ROW_PATTERN = /^\|\s*(V\d+\.\d+)\s*\|\s*(\d{4}-\d{2}-\d{2})\s*\|\s*(.+?)\s*\|$/gm;

async function readDocumentationVersionMarkdown(): Promise<string> {
    return fs.readFile(DOC_PATH, "utf8");
}

function parseReleaseEntries(markdown: string): PublicReleaseEntry[] {
    return [...markdown.matchAll(CHANGELOG_ROW_PATTERN)].map((match) => ({
        version: match[1]?.trim() ?? "",
        date: match[2]?.trim() ?? "",
        summary: match[3]?.trim() ?? "",
    }));
}

function parseCurrentVersion(markdown: string): string {
    return markdown.match(CURRENT_VERSION_PATTERN)?.[1]?.trim() ?? "V1.00";
}

function parseLastCorrected(markdown: string): string {
    return markdown.match(LAST_CORRECTED_PATTERN)?.[1]?.trim() ?? "";
}

async function getLatestGitRevision(): Promise<PublicGitRevisionMeta | null> {
    try {
        const { stdout } = await execFileAsync("git", ["log", "-1", "--format=%cI|%h|%s"], { cwd: process.cwd() });
        const [committedAt, shortHash, subject] = stdout.trim().split("|");
        if (!committedAt || !shortHash) return null;
        return {
            committedAt: committedAt.trim(),
            shortHash: shortHash.trim(),
            subject: (subject ?? "").trim(),
        };
    } catch {
        return null;
    }
}

export async function getPublicReleaseNotes(): Promise<PublicReleaseNotes> {
    const markdown = await readDocumentationVersionMarkdown();
    const [latestGitRevision] = await Promise.all([getLatestGitRevision()]);

    return {
        currentVersion: parseCurrentVersion(markdown),
        lastCorrected: parseLastCorrected(markdown),
        entries: parseReleaseEntries(markdown),
        latestGitRevision,
    };
}
