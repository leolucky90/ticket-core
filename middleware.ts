import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function detectLang(acceptLanguage: string | null): "zh" | "en" {
    const v = (acceptLanguage ?? "").toLowerCase();
    return v.includes("zh") ? "zh" : "en";
}

function withLangCookie(req: NextRequest, res: NextResponse): NextResponse {
    const raw = req.cookies.get("lang")?.value;
    const hasValidLang = raw === "zh" || raw === "en";
    if (!hasValidLang) {
        const lang = detectLang(req.headers.get("accept-language"));
        res.cookies.set("lang", lang, {
            path: "/",
            maxAge: 60 * 60 * 24 * 365,
            sameSite: "lax",
        });
    }
    return res;
}

function nextWithPathname(req: NextRequest): NextResponse {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-pathname", req.nextUrl.pathname);
    return NextResponse.next({
        request: { headers: requestHeaders },
    });
}

function normalizeHostHeader(value: string | null): string {
    if (!value) return "";
    return value.toLowerCase().split(":")[0]?.trim() ?? "";
}

function shouldRewriteToTenantByHost(req: NextRequest): boolean {
    if (req.nextUrl.pathname !== "/") return false;

    const host = normalizeHostHeader(req.headers.get("host"));
    if (!host) return false;

    const appHost = normalizeHostHeader(process.env.NEXT_PUBLIC_APP_HOST ?? process.env.APP_HOST ?? null);
    if (!appHost) return false;

    if (host === appHost || host === `www.${appHost}` || host === `app.${appHost}`) return false;

    return true;
}

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;
    const isTenantDashboardPath = /^\/[^/]+\/dashboard(?:\/)?$/.test(pathname);

    const isProtected =
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/customer-dashboard") ||
        isTenantDashboardPath ||
        pathname.startsWith("/settings") ||
        pathname.startsWith("/sales");
    if (!isProtected) {
        if (shouldRewriteToTenantByHost(req)) {
            const url = req.nextUrl.clone();
            url.pathname = "/site/by-host";
            return withLangCookie(req, NextResponse.rewrite(url));
        }
        return withLangCookie(req, nextWithPathname(req));
    }

    const hasSession = Boolean(req.cookies.get("session")?.value);
    if (!hasSession) {
        const url = req.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("next", `${pathname}${req.nextUrl.search}`);
        return withLangCookie(req, NextResponse.redirect(url));
    }

    return withLangCookie(req, nextWithPathname(req));
}

export const config = {
    matcher: ["/((?!api|_next|favicon.ico|.*\\..*).*)"],
};
