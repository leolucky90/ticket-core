import "server-only";
import { fbAdminDb } from "@/lib/firebase-server";
import {
    DEFAULT_BUSINESS_HOMEPAGE_CONTENT_STATE,
    normalizeBusinessHomepageContentState,
    type BusinessHomepageContentState,
} from "@/features/business/services/businessHomepageContent";

const BUSINESS_HOMEPAGE_DOC = "app_config/business_homepage";

export type BusinessHomepageContentPreferences = {
    content: BusinessHomepageContentState;
    updatedAt: number;
    updatedBy: string;
};

function cloneDefaultContent(): BusinessHomepageContentState {
    return JSON.parse(JSON.stringify(DEFAULT_BUSINESS_HOMEPAGE_CONTENT_STATE)) as BusinessHomepageContentState;
}

function toBusinessHomepageContentPreferences(input: unknown): BusinessHomepageContentPreferences {
    const candidate = (input ?? {}) as Partial<BusinessHomepageContentPreferences> & {
        content?: unknown;
    };

    return {
        content: normalizeBusinessHomepageContentState(candidate.content ?? cloneDefaultContent()),
        updatedAt: typeof candidate.updatedAt === "number" ? candidate.updatedAt : 0,
        updatedBy: typeof candidate.updatedBy === "string" ? candidate.updatedBy : "",
    };
}

export async function getBusinessHomepageContentPreferences(): Promise<BusinessHomepageContentPreferences> {
    try {
        const snap = await fbAdminDb.doc(BUSINESS_HOMEPAGE_DOC).get();
        if (snap.exists) return toBusinessHomepageContentPreferences(snap.data());
    } catch {
        return {
            content: cloneDefaultContent(),
            updatedAt: 0,
            updatedBy: "",
        };
    }

    return {
        content: cloneDefaultContent(),
        updatedAt: 0,
        updatedBy: "",
    };
}

export async function saveBusinessHomepageContentPreferences(params: {
    updatedBy: string;
    content: unknown;
}): Promise<BusinessHomepageContentPreferences> {
    const next: BusinessHomepageContentPreferences = {
        content: normalizeBusinessHomepageContentState(params.content),
        updatedAt: Date.now(),
        updatedBy: params.updatedBy,
    };

    await fbAdminDb.doc(BUSINESS_HOMEPAGE_DOC).set(next, { merge: true });
    return next;
}
