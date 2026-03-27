import { redirect } from "next/navigation";
import { MerchantPageShell } from "@/components/merchant/shell";
import { AccountSecurityPanel } from "@/components/account/AccountSecurityPanel";
import { getSessionUser } from "@/lib/auth-enterprise/session.server";
import { getCurrentStaffProfile } from "@/lib/services/staff.service";

export default async function AccountSecurityPage() {
    const session = await getSessionUser();
    if (!session) {
        redirect("/login?next=/account/security");
    }
    const staff = await getCurrentStaffProfile();

    return (
        <MerchantPageShell title="Account Security" subtitle="密碼、Google 綁定、登入安全資訊" width="default">
            {staff?.mustChangePassword ? (
                <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-3 py-2 text-sm">
                    需先重設密碼：請立即更新登入密碼後再繼續操作。
                </div>
            ) : null}
            <AccountSecurityPanel email={session.email} staff={staff} />
        </MerchantPageShell>
    );
}
