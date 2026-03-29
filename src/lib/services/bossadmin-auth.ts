import { DEMO_ACCOUNT_PASSWORD } from "@/lib/demo-account-password";

export const BOSS_ADMIN_COOKIE = "bossadmin_session";
export const BOSS_ADMIN_EMAIL = "bossadmin@gmail.com";
export const BOSS_ADMIN_PASSWORD = DEMO_ACCOUNT_PASSWORD;

export function isBossAdminAuthed(cookieValue: string | null | undefined): boolean {
    return cookieValue === "ok";
}
