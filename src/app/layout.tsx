import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { Fraunces, Manrope } from "next/font/google";
import { NavigationProgress } from "@/components/layout/navigation-progress";
import { UiLanguageProvider } from "@/components/layout/ui-language-provider";
import { getUiLanguage } from "@/lib/i18n/ui-text";
import { getThemeInitScript } from "@/lib/services/themePreferences";
import "@/styles/globals.css";
import "@/styles/auth.css";

export const metadata = {
  title: "Ticket Core | SaaS + AI Commerce Platform",
  description: "Multi-tenant ERP, repair workflow, POS, commerce, and AI-ready showcase platform built with Next.js 16.",
};

type RootLayoutProps = {
  children: ReactNode;
};

const themeInitScript = getThemeInitScript();
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export default async function RootLayout({ children }: RootLayoutProps) {
  const cookieStore = await cookies();
  const langCookie = cookieStore.get("lang")?.value;
  const uiLang = getUiLanguage(langCookie);
  const htmlLang = uiLang === "en" ? "en" : "zh-Hant";

  return (
    <html lang={htmlLang} suppressHydrationWarning className={`${manrope.variable} ${fraunces.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body suppressHydrationWarning>
        <UiLanguageProvider lang={uiLang}>
          <NavigationProgress />
          {children}
        </UiLanguageProvider>
      </body>
    </html>
  );
}
