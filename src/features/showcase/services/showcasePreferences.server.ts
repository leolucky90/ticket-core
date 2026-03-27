import "server-only";
import { fbAdminDb } from "@/lib/firebase-server";
import {
    DEFAULT_SHOW_THEME_COLORS,
    DEFAULT_STOREFRONT_SETTINGS,
    normalizeShowThemeColors,
    normalizeStorefrontSettings,
} from "@/features/showcase/services/showThemePreferences";
import {
    DEFAULT_SHOW_CONTENT_STATE,
    normalizeShowContentState,
    serializeShowContentState,
} from "@/features/showcase/services/showContentPreferences";
import type { ShowThemeColors, StorefrontSettings } from "@/features/showcase/types/showTheme";
import type { ShowContentState } from "@/features/showcase/types/showContent";

const LEGACY_SHOWCASE_PREFERENCES_DOC = "app_config/showcase";

export type ShowcasePreferences = {
    themeColors: ShowThemeColors;
    storefront: StorefrontSettings;
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
    if (!trimmed) return null;
    if (/[/?#]/.test(trimmed)) return null;
    return trimmed;
}

function tenantCompanyDocRef(tenantId: string) {
    return fbAdminDb.collection("companies").doc(tenantId);
}

function tenantShowcaseDocRef(tenantId: string) {
    return tenantCompanyDocRef(tenantId).collection("app_config").doc("showcase");
}

function toShowcasePreferences(input: unknown): ShowcasePreferences {
    const candidate = (input ?? {}) as Partial<ShowcasePreferences> & {
        themeColors?: unknown;
        storefront?: unknown;
        content?: unknown;
    };
    return {
        themeColors: normalizeShowThemeColors((candidate.themeColors ?? DEFAULT_SHOW_THEME_COLORS) as Partial<ShowThemeColors>),
        storefront: normalizeStorefrontSettings((candidate.storefront ?? DEFAULT_STOREFRONT_SETTINGS) as Partial<StorefrontSettings>),
        content: normalizeShowContentState(candidate.content ?? cloneDefaultContent()),
        updatedAt: typeof candidate.updatedAt === "number" ? candidate.updatedAt : 0,
        updatedBy: typeof candidate.updatedBy === "string" ? candidate.updatedBy : "",
    };
}

export async function getShowcasePreferences(options?: { tenantId?: string | null }): Promise<ShowcasePreferences> {
    const tenantId = normalizeTenantId(options?.tenantId);
    if (tenantId) {
        const tenantSnap = await tenantShowcaseDocRef(tenantId).get();
        if (tenantSnap.exists) return toShowcasePreferences(tenantSnap.data());
        return {
            themeColors: DEFAULT_SHOW_THEME_COLORS,
            storefront: DEFAULT_STOREFRONT_SETTINGS,
            content: cloneDefaultContent(),
            updatedAt: 0,
            updatedBy: "",
        };
    }

    const legacySnap = await fbAdminDb.doc(LEGACY_SHOWCASE_PREFERENCES_DOC).get();
    if (legacySnap.exists) return toShowcasePreferences(legacySnap.data());

    return {
        themeColors: DEFAULT_SHOW_THEME_COLORS,
        storefront: DEFAULT_STOREFRONT_SETTINGS,
        content: cloneDefaultContent(),
        updatedAt: 0,
        updatedBy: "",
    };
}

export async function saveShowcasePreferences(params: {
    tenantId: string;
    updatedBy: string;
    themeColors?: unknown;
    storefront?: unknown;
    content?: unknown;
}): Promise<ShowcasePreferences> {
    const tenantId = normalizeTenantId(params.tenantId);
    if (!tenantId) throw new Error("Missing tenantId");

    const current = await getShowcasePreferences({ tenantId });
    const normalizedContent = params.content !== undefined ? normalizeShowContentState(params.content) : current.content;
    const next: ShowcasePreferences = {
        themeColors:
            params.themeColors !== undefined
                ? normalizeShowThemeColors(params.themeColors as Partial<ShowThemeColors>)
                : current.themeColors,
        storefront:
            params.storefront !== undefined
                ? normalizeStorefrontSettings(params.storefront as Partial<StorefrontSettings>)
                : current.storefront,
        content: normalizedContent,
        updatedAt: Date.now(),
        updatedBy: params.updatedBy,
    };
    const batch = fbAdminDb.batch();
    batch.set(
        tenantShowcaseDocRef(tenantId),
        {
            ...next,
            content: serializeShowContentState(normalizedContent),
        },
        { merge: true },
    );
    // Ensure tenant root doc is visible in Firestore console even when only subcollections are used.
    batch.set(
        tenantCompanyDocRef(tenantId),
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
