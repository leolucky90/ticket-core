import type { StaffMember } from "@/lib/schema";
import { StaffGoogleBindingClient } from "@/components/account/StaffGoogleBindingClient";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";

type AccountSecurityPanelProps = {
    email: string;
    staff: StaffMember | null;
};

export function AccountSecurityPanel({ email, staff }: AccountSecurityPanelProps) {
    const linked = Boolean(staff?.googleLinked);
    return (
        <div className="grid max-w-3xl gap-4">
            <Card className="grid gap-2">
                <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-medium">帳號安全狀態</div>
                    <StatusBadge label={staff?.status ?? "unknown"} tone={staff?.status === "active" ? "success" : "warning"} />
                </div>
                <div className="grid gap-1 text-sm text-[rgb(var(--muted))]">
                    <div>主信箱：{email}</div>
                    <div>最後登入：{staff?.lastLoginAt ?? "-"}</div>
                    <div>Google 綁定：{linked ? "已綁定" : "未綁定"}</div>
                    <div>需下次改密碼：{staff?.mustChangePassword ? "是" : "否"}</div>
                </div>
            </Card>

            <Card className="grid gap-2">
                <div className="text-sm font-medium">Google 綁定</div>
                {staff ? (
                    <StaffGoogleBindingClient
                        staffId={staff.id}
                        primaryEmail={staff.email}
                        linked={Boolean(staff.googleLinked)}
                        googleEmail={staff.googleEmail}
                    />
                ) : (
                    <div className="text-sm text-[rgb(var(--muted))]">目前帳號尚未建立 staff profile，無法綁定 Google。</div>
                )}
            </Card>

            <Card>
                <ChangePasswordForm email={email} />
            </Card>

            <Card className="grid gap-2">
                <div className="text-sm font-medium">兩步驟驗證（2FA）</div>
                <div className="text-sm text-[rgb(var(--muted))]">
                    目前保留擴充架構，後續可接入 OTP / TOTP / WebAuthn。
                </div>
            </Card>
        </div>
    );
}

