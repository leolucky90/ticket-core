// src/app/layout.tsx
import type { ReactNode } from "react"; // 引入 ReactNode 型別，用來描述 children 的型別
import { cookies } from "next/headers";
import "@/styles/globals.css"; // 全域 CSS（含 Tailwind + CSS Variables theme）
import "@/styles/auth.css";

export const metadata = { // Next.js App Router 的 metadata，用來設定頁面基本資訊
  title: "Ticket Core", // 網站標題（不涉及顏色，符合規範）
  description: "Next.js 16 + TS strict + Tailwind v4 + CSS Variables", // 網站描述
}; // metadata 結束

type RootLayoutProps = { // 定義 RootLayout 的 props 型別
  children: ReactNode; // children 是 ReactNode，代表可渲染的任何內容
}; // props 型別結束

const themeInitScript = `
(() => {
  try {
    const stored = localStorage.getItem("theme");
    const theme = stored === "light" || stored === "dark" ? stored : "dark";
    document.documentElement.setAttribute("data-theme", theme);
  } catch {}
})();
`;

export default async function RootLayout({ children }: RootLayoutProps) { // layout 可以 default export（規範允許 Page/layout default export）
  const cookieStore = await cookies();
  const langCookie = cookieStore.get("lang")?.value;
  const htmlLang = langCookie === "en" ? "en" : "zh-Hant";

  return ( // 回傳整個 HTML 結構
    <html lang={htmlLang} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        {children}
      </body>
    </html> // html 結束
  ); // return 結束
} // RootLayout 結束
