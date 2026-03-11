import { BusinessLandingPage } from "@/features/business/components/BusinessLandingPage";
import { cookies } from "next/headers";

export default async function HomePage() {
    const cookieStore = await cookies();
    const langCookie = cookieStore.get("lang")?.value;
    const lang: "zh" | "en" = langCookie === "en" ? "en" : "zh";
    return <BusinessLandingPage lang={lang} />;
}
