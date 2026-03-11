import "server-only";
import { fbAdminDb } from "@/lib/firebase-server";
import { DEFAULT_SHOW_THEME_COLORS, normalizeShowThemeColors } from "@/features/showcase/services/showThemePreferences";
import { DEFAULT_SHOW_CONTENT_STATE, normalizeShowContentState } from "@/features/showcase/services/showContentPreferences";
import type { ShowThemeColors } from "@/features/showcase/types/showTheme";
import type { ShowContentState } from "@/features/showcase/types/showContent";

const LEGACY_SHOWCASE_PREFERENCES_DOC = "app_config/showcase";

export type ShowcasePreferences = {
    themeColors: ShowThemeColors;
    content: ShowContentState;
    updatedAt: number;
    updatedBy: string;
};

function cloneDefaultContent(): ShowContentState {
    return JSON.parse(JSON.stringify(DEFAULT_SHOW_CONTENT_STATE)) as ShowContentState;
}

function normalizeTenantId(value: unknown): string | null {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

function tenantShowcaseDocPath(tenantId: string): string {
    return `companies/${tenantId}/app_config/showcase`;
}

function tenantCompanyDocPath(tenantId: string): string {
    return `companies/${tenantId}`;
}

function toShowcasePreferences(input: unknown): ShowcasePreferences {
    const candidate = (input ?? {}) as Partial<ShowcasePreferences> & {
        themeColors?: unknown;
        content?: unknown;
    };
    return {
        themeColors: normalizeShowThemeColors((candidate.themeColors ?? DEFAULT_SHOW_THEME_COLORS) as Partial<ShowThemeColors>),
        content: normalizeShowContentState(candidate.content ?? cloneDefaultContent()),
        updatedAt: typeof candidate.updatedAt === "number" ? candidate.updatedAt : 0,
        updatedBy: typeof candidate.updatedBy === "string" ? candidate.updatedBy : "",
    };
}

export async function getShowcasePreferences(options?: { tenantId?: string | null }): Promise<ShowcasePreferences> {
    const tenantId = normalizeTenantId(options?.tenantId);
    if (tenantId) {
        const tenantSnap = await fbAdminDb.doc(tenantShowcaseDocPath(tenantId)).get();
        if (tenantSnap.exists) return toShowcasePreferences(tenantSnap.data());
        return {
            themeColors: DEFAULT_SHOW_THEME_COLORS,
            content: cloneDefaultContent(),
            updatedAt: 0,
            updatedBy: "",
        };
    }

    const legacySnap = await fbAdminDb.doc(LEGACY_SHOWCASE_PREFERENCES_DOC).get();
    if (legacySnap.exists) return toShowcasePreferences(legacySnap.data());

    return {
        themeColors: DEFAULT_SHOW_THEME_COLORS,
        content: cloneDefaultContent(),
        updatedAt: 0,
        updatedBy: "",
    };
}

export async function saveShowcasePreferences(params: {
    tenantId: string;
    updatedBy: string;
    themeColors?: unknown;
    content?: unknown;
}): Promise<ShowcasePreferences> {
    const tenantId = normalizeTenantId(params.tenantId);
    if (!tenantId) throw new Error("Missing tenantId");

    const current = await getShowcasePreferences({ tenantId });
    const next: ShowcasePreferences = {
        themeColors:
            params.themeColors !== undefined
                ? normalizeShowThemeColors(params.themeColors as Partial<ShowThemeColors>)
                : current.themeColors,
        content: params.content !== undefined ? normalizeShowContentState(params.content) : current.content,
        updatedAt: Date.now(),
        updatedBy: params.updatedBy,
    };
    const batch = fbAdminDb.batch();
    batch.set(fbAdminDb.doc(tenantShowcaseDocPath(tenantId)), next, { merge: true });
    // Ensure tenant root doc is visible in Firestore console even when only subcollections are used.
    batch.set(
        fbAdminDb.doc(tenantCompanyDocPath(tenantId)),
        {
            id: tenantId,
            lastShowcaseUpdatedAt: next.updatedAt,
            lastUpdatedBy: params.updatedBy,
        },
        { merge: true },
    );
    await batch.commit();
    return next;
}
