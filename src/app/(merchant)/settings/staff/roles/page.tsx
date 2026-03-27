import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { MerchantPageShell } from "@/components/merchant/shell";
import { PermissionLevelsSettingsPanel } from "@/components/settings/PermissionLevelsSettingsPanel";
import { getPermissionLevels, updatePermissionLevel } from "@/lib/services/permission-level.service";

type StaffRolesPageProps = {
    searchParams: Promise<{
        flash?: string;
        ts?: string;
    }>;
};

function parsePermissions(rawValues: FormDataEntryValue[]): string[] {
    return rawValues
        .map((item) => (typeof item === "string" ? item : ""))
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
        .flatMap((item) => item.split(","))
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
}

export default async function StaffRolesPage({ searchParams }: StaffRolesPageProps) {
    const cookieStore = await cookies();
    const langCookie = cookieStore.get("lang")?.value;
    const lang: "zh" | "en" = langCookie === "en" ? "en" : "zh";
    const levels = await getPermissionLevels();
    const sp = await searchParams;
    const ui =
        lang === "zh"
            ? {
                  updated: "權限等級已更新",
                  failed: "更新失敗",
                  title: "權限等級設定",
                  subtitle: "固定 Lv1 ~ Lv9，使用方塊勾選權限",
              }
            : {
                  updated: "Permission levels updated",
                  failed: "Update failed",
                  title: "Permission Levels",
                  subtitle: "Fixed Lv1 ~ Lv9 with checkbox permission editor",
              };

    async function saveAction(formData: FormData): Promise<void> {
        "use server";
        try {
            await updatePermissionLevel({
                level: Number(formData.get("level")),
                displayName: typeof formData.get("displayName") === "string" ? (formData.get("displayName") as string) : undefined,
                isActive: formData.get("isActive") === "on",
                permissions: parsePermissions(formData.getAll("permissions[]")),
            });
            redirect(`/settings/staff/roles?flash=${encodeURIComponent(ui.updated)}&ts=${Date.now()}`);
        } catch (error) {
            const message = error instanceof Error ? error.message : ui.failed;
            redirect(`/settings/staff/roles?flash=${encodeURIComponent(message)}&ts=${Date.now()}`);
        }
    }

    return (
        <MerchantPageShell title={ui.title} subtitle={ui.subtitle} width="index">
            {sp.flash ? <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-3 py-2 text-sm">{sp.flash}</div> : null}
            <PermissionLevelsSettingsPanel levels={levels} saveAction={saveAction} canEdit={true} lang={lang} />
        </MerchantPageShell>
    );
}
