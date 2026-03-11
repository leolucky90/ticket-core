import "server-only";
import { fbAdminDb } from "@/lib/firebase-server";
import {
    DEFAULT_THEME_CUSTOM_COLORS,
    DEFAULT_THEME_MODE,
    normalizeThemeState,
} from "@/lib/services/themePreferences";
import type { ThemeState } from "@/lib/types/theme";

const LEGACY_DASHBOARD_PREFERENCES_DOC = "app_config/dashboard";

export type DashboardPreferences = {
    theme: ThemeState;
    updatedAt: number;
    updatedBy: string;
};

function normalizeTenantId(value: unknown): string | null {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

function tenantDashboardDocPath(tenantId: string): string {
    return `companies/${tenantId}/app_config/dashboard`;
}

function tenantCompanyDocPath(tenantId: string): string {
    return `companies/${tenantId}`;
}

function toDashboardPreferences(input: unknown): DashboardPreferences {
    const candidate = (input ?? {}) as Partial<DashboardPreferences> & {
        theme?: unknown;
        mode?: unknown;
        customColors?: unknown;
    };
    const legacyTheme = {
        mode: candidate.mode,
        customColors: candidate.customColors,
    };
    return {
        theme: normalizeThemeState(candidate.theme ?? legacyTheme),
        updatedAt: typeof candidate.updatedAt === "number" ? candidate.updatedAt : 0,
        updatedBy: typeof candidate.updatedBy === "string" ? candidate.updatedBy : "",
    };
}

export async function getDashboardPreferences(options?: { tenantId?: string | null }): Promise<DashboardPreferences> {
    const tenantId = normalizeTenantId(options?.tenantId);
    if (tenantId) {
        const tenantSnap = await fbAdminDb.doc(tenantDashboardDocPath(tenantId)).get();
        if (tenantSnap.exists) return toDashboardPreferences(tenantSnap.data());
        return {
            theme: {
                mode: DEFAULT_THEME_MODE,
                customColors: DEFAULT_THEME_CUSTOM_COLORS,
            },
            updatedAt: 0,
            updatedBy: "",
        };
    }

    const legacySnap = await fbAdminDb.doc(LEGACY_DASHBOARD_PREFERENCES_DOC).get();
    if (legacySnap.exists) return toDashboardPreferences(legacySnap.data());

    return {
        theme: {
            mode: DEFAULT_THEME_MODE,
            customColors: DEFAULT_THEME_CUSTOM_COLORS,
        },
        updatedAt: 0,
        updatedBy: "",
    };
}

export async function saveDashboardPreferences(params: {
    tenantId: string;
    updatedBy: string;
    theme?: unknown;
}): Promise<DashboardPreferences> {
    const tenantId = normalizeTenantId(params.tenantId);
    if (!tenantId) throw new Error("Missing tenantId");

    const current = await getDashboardPreferences({ tenantId });
    const next: DashboardPreferences = {
        theme: params.theme !== undefined ? normalizeThemeState(params.theme) : current.theme,
        updatedAt: Date.now(),
        updatedBy: params.updatedBy,
    };
    const batch = fbAdminDb.batch();
    batch.set(fbAdminDb.doc(tenantDashboardDocPath(tenantId)), next, { merge: true });
    batch.set(
        fbAdminDb.doc(tenantCompanyDocPath(tenantId)),
        {
            id: tenantId,
            lastDashboardUpdatedAt: next.updatedAt,
            lastUpdatedBy: params.updatedBy,
        },
        { merge: true },
    );
    await batch.commit();
    return next;
}
