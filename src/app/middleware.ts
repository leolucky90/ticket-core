// src/app/middleware.ts

import { NextResponse } from "next/server"; // Next middleware 回應工具
import type { NextRequest } from "next/server"; // request 型別
import { DEFAULT_LOCALE, LOCALES } from "@/lib/i18n/locales"; // locale 定義

function hasLocalePrefix(pathname: string) { // 檢查 URL 是否已包含 locale 前綴
    return LOCALES.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`)); // 任一語系符合即 true
} // hasLocalePrefix 結束

export function middleware(req: NextRequest) { // middleware 主函式
    const { pathname } = req.nextUrl; // 取出目前路徑

    if ( // 若是 static、api 等不處理
        pathname.startsWith("/api") ||
        pathname.startsWith("/_next") ||
        pathname.startsWith("/favicon.ico")
    ) {
        return NextResponse.next(); // 直接放行
    } // if 結束

    if (hasLocalePrefix(pathname)) { // 已有 locale 前綴
        return NextResponse.next(); // 放行
    } // if 結束

    const url = req.nextUrl.clone(); // clone url 以便修改
    url.pathname = `/${DEFAULT_LOCALE}${pathname}`; // 加上預設語系前綴
    return NextResponse.redirect(url); // 重新導向
} // middleware 結束

export const config = { // 指定 middleware 適用範圍
    matcher: ["/((?!api|_next|favicon.ico).*)"], // 排除 api/_next/favicon
}; // config 結束