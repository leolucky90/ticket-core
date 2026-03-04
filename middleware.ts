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

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    const isProtected =
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/settings") ||
        pathname.startsWith("/ticket") ||
        pathname.startsWith("/sales");
    if (!isProtected) return withLangCookie(req, NextResponse.next());

    const hasSession = Boolean(req.cookies.get("session")?.value);
    if (!hasSession) {
        const url = req.nextUrl.clone();
        url.pathname = "/";
        url.searchParams.set("next", `${pathname}${req.nextUrl.search}`);
        return withLangCookie(req, NextResponse.redirect(url));
    }

    return withLangCookie(req, NextResponse.next());
}

export const config = {
    matcher: ["/((?!api|_next|favicon.ico|.*\\..*).*)"],
};
