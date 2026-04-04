import "server-only";
import { fbAdminAuth } from "@/lib/firebase-server";
import { getSessionUser } from "@/lib/auth-enterprise/session.server";
import type { BusinessProfile } from "@/lib/schema/business-profile.schema";
import type { RegionalReceiptSettings } from "@/lib/schema/regional-receipt-settings.schema";
import { getBusinessProfile } from "@/lib/services/business-profile.service";
import { getRegionalReceiptSettings } from "@/lib/services/regional-receipt-settings.service";
import { getCurrentSessionAccountContext } from "@/lib/services/staff.service";
import { toAccountType, type AccountType } from "@/lib/services/user.service";

export type AuthAccountSummary = {
    accountType: AccountType;
    email: string;
    uid: string;
    provider?: string;
    createdAt?: string;
    lastLoginAt?: string;
};

export type AccountSettingsPageData = {
    accountSummary: AuthAccountSummary;
    businessProfile: BusinessProfile | null;
    regionalReceiptSettings: RegionalReceiptSettings | null;
};

function humanizeProvider(providerId: string): string {
    if (providerId === "password") return "Email / Password";
    if (providerId === "google.com") return "Google";
    return providerId;
}

function mapProvider(providerIds: string[]): string | undefined {
    const normalized = Array.from(new Set(providerIds.filter((item) => item.trim().length > 0)));
    if (normalized.length === 0) return undefined;
    return normalized.map((item) => humanizeProvider(item)).join(", ");
}

export async function getAccountSettingsPageData(): Promise<AccountSettingsPageData | null> {
    const session = await getSessionUser();
    if (!session) return null;

    const accountContext = await getCurrentSessionAccountContext();
    const accountType = accountContext?.accountType ?? toAccountType(accountContext?.userDoc?.role);

    let provider: string | undefined;
    let createdAt: string | undefined;
    let lastLoginAt: string | undefined;

    try {
        const record = await fbAdminAuth.getUser(session.uid);
        const providerIds = (record.providerData ?? []).map((row) => row.providerId).filter(Boolean);
        const fallbackProviders = accountContext?.userDoc?.providers ?? [];
        provider = mapProvider(providerIds.length > 0 ? providerIds : fallbackProviders);
        createdAt = record.metadata.creationTime ? new Date(record.metadata.creationTime).toISOString() : undefined;
        lastLoginAt = record.metadata.lastSignInTime ? new Date(record.metadata.lastSignInTime).toISOString() : undefined;
    } catch {
        provider = mapProvider(accountContext?.userDoc?.providers ?? []);
    }

    if (accountType !== "company") {
        return {
            accountSummary: {
                accountType,
                email: session.email,
                uid: session.uid,
                provider,
                createdAt,
                lastLoginAt,
            },
            businessProfile: null,
            regionalReceiptSettings: null,
        };
    }

    const [businessProfile, regionalReceiptSettings] = await Promise.all([getBusinessProfile(), getRegionalReceiptSettings()]);

    return {
        accountSummary: {
            accountType,
            email: session.email,
            uid: session.uid,
            provider,
            createdAt,
            lastLoginAt,
        },
        businessProfile,
        regionalReceiptSettings,
    };
}
