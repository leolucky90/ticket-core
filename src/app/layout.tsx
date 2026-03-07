import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { getThemeInitScript } from "@/lib/services/themePreferences";
import "@/styles/globals.css";
import "@/styles/auth.css";

export const metadata = {
  title: "Ticket Core",
  description: "Next.js 16 + TS strict + Tailwind v4 + CSS Variables",
};

type RootLayoutProps = {
  children: ReactNode;
};

const themeInitScript = getThemeInitScript();

export default async function RootLayout({ children }: RootLayoutProps) {
  const cookieStore = await cookies();
  const langCookie = cookieStore.get("lang")?.value;
  const htmlLang = langCookie === "en" ? "en" : "zh-Hant";

  return (
    <html lang={htmlLang} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
