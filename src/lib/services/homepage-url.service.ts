import "server-only";
import { fbAdminDb } from "@/lib/firebase-server";
import { normalizeTenantId } from "@/lib/tenant-scope";

type CompanyDomainDoc = {
    customDomain?: unknown;
    primaryDomain?: unknown;
    publicDomain?: unknown;
    domain?: unknown;
    homepageDomain?: unknown;
    subdomain?: unknown;
    slug?: unknown;
};

function normalizeText(value: unknown): string {
    if (typeof value !== "string") return "";
    return value.trim();
}

function normalizeDomain(value: unknown): string | null {
    const raw = normalizeText(value).toLowerCase();
    if (!raw) return null;
    const host = raw.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (!host) return null;
    if (!/^[a-z0-9.-]+$/.test(host)) return null;
    return host;
}

function normalizeSubdomain(value: unknown): string | null {
    const raw = normalizeText(value).toLowerCase();
    if (!raw) return null;
    const cleaned = raw
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "");
    if (!cleaned) return null;
    return cleaned;
}

function buildInternalSitePath(tenantId: string): string {
    return `/${encodeURIComponent(tenantId)}`;
}

export async function resolveCustomerHomepageUrl(companyId: string | null | undefined): Promise<string | null> {
    // Public homepage routing still exposes a tenant alias, but it resolves from the internal company scope key.
    const tenantId = normalizeTenantId(companyId);
    if (!tenantId) return null;

    const companySnap = await fbAdminDb.doc(`companies/${tenantId}`).get();
    const company = (companySnap.data() ?? {}) as CompanyDomainDoc;

    const customDomain =
        normalizeDomain(company.customDomain) ??
        normalizeDomain(company.primaryDomain) ??
        normalizeDomain(company.publicDomain) ??
        normalizeDomain(company.homepageDomain) ??
        normalizeDomain(company.domain);
    if (customDomain) return `https://${customDomain}`;

    const defaultBaseDomain =
        normalizeDomain(process.env.NEXT_PUBLIC_CUSTOMER_DEFAULT_DOMAIN) ??
        normalizeDomain(process.env.CUSTOMER_DEFAULT_DOMAIN);
    const preferredSubdomain = normalizeSubdomain(company.subdomain) ?? normalizeSubdomain(company.slug);

    if (defaultBaseDomain && preferredSubdomain && preferredSubdomain.length > 0) {
        return `https://${preferredSubdomain}.${defaultBaseDomain}`;
    }

    return buildInternalSitePath(tenantId);
}

export async function resolveTenantIdByHost(hostHeader: string | null | undefined): Promise<string | null> {
    // Host-based tenant resolution returns the public tenant alias, which is currently the same underlying company key.
    const host = normalizeDomain(hostHeader);
    if (!host) return null;

    const appHost = normalizeDomain(process.env.NEXT_PUBLIC_APP_HOST) ?? normalizeDomain(process.env.APP_HOST);
    if (appHost && (host === appHost || host === `www.${appHost}` || host === `app.${appHost}`)) {
        return null;
    }

    const defaultBaseDomain =
        normalizeDomain(process.env.NEXT_PUBLIC_CUSTOMER_DEFAULT_DOMAIN) ??
        normalizeDomain(process.env.CUSTOMER_DEFAULT_DOMAIN);
    if (defaultBaseDomain && host.endsWith(`.${defaultBaseDomain}`)) {
        const subdomain = host.slice(0, host.length - (`.${defaultBaseDomain}`).length);
        const mappedSubdomain = normalizeSubdomain(subdomain);
        if (mappedSubdomain) {
            const bySubdomain = await fbAdminDb.collection("companies").where("subdomain", "==", mappedSubdomain).limit(1).get();
            if (!bySubdomain.empty) return bySubdomain.docs[0]?.id ?? null;

            const bySlug = await fbAdminDb.collection("companies").where("slug", "==", mappedSubdomain).limit(1).get();
            if (!bySlug.empty) return bySlug.docs[0]?.id ?? null;
        }
    }

    const domainSnap = await fbAdminDb.collection("domains").doc(host).get();
    if (!domainSnap.exists) return null;
    const domainDoc = (domainSnap.data() ?? {}) as {
        tenantId?: unknown;
        companyId?: unknown;
        slug?: unknown;
    };

    return normalizeTenantId(domainDoc.tenantId) ?? normalizeTenantId(domainDoc.companyId) ?? normalizeTenantId(domainDoc.slug);
}
