import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BOSS_ADMIN_COOKIE, isBossAdminAuthed } from "@/lib/services/bossadmin-auth";

export default async function BossAdminAliasPage() {
    // Keep the typo route as a thin redirect shim so old links do not break.
    const cookieStore = await cookies();
    const isAuthed = isBossAdminAuthed(cookieStore.get(BOSS_ADMIN_COOKIE)?.value);

    if (isAuthed) {
        redirect("/bossadmin?tab=dashboard");
    }
    redirect("/bossadmin");
}
