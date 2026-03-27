export const BOSS_ADMIN_COOKIE = "bossadmin_session";
export const BOSS_ADMIN_EMAIL = "bossadmin@gmail.com";
export const BOSS_ADMIN_PASSWORD = "123456";

export function isBossAdminAuthed(cookieValue: string | null | undefined): boolean {
    return cookieValue === "ok";
}
