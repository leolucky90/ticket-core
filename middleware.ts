import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    const isProtected = pathname.startsWith("/dashboard") || pathname.startsWith("/settings");
    if (!isProtected) return NextResponse.next();

    const hasSession = Boolean(req.cookies.get("session")?.value);
    if (!hasSession) {
        const url = req.nextUrl.clone();
        url.pathname = "/";
        url.searchParams.set("next", pathname);
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*", "/settings/:path*"],
};