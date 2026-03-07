import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Section } from "@/components/ui/section";
import { getSessionUser } from "@/lib/auth-enterprise/session.server";
import { getUserDoc, toAccountType } from "@/lib/services/user.service";

export default async function AccountInfoPage() {
    const session = await getSessionUser();
    if (!session) {
        redirect("/login?next=/settings/account");
    }

    const user = await getUserDoc(session.uid);
    const accountType = toAccountType(user?.role ?? null);
    const accountTypeText = accountType === "company" ? "公司帳號" : "客戶帳號";

    return (
        <Section title="帳戶資訊">
            <Card>
                <div className="grid gap-3">
                    <div className="text-sm">
                        <span className="text-[rgb(var(--muted))]">帳號類型：</span>
                        <span>{accountTypeText}</span>
                    </div>
                    <div className="text-sm">
                        <span className="text-[rgb(var(--muted))]">Email：</span>
                        <span>{session.email}</span>
                    </div>
                    <div className="text-sm">
                        <span className="text-[rgb(var(--muted))]">UID：</span>
                        <span className="break-all">{session.uid}</span>
                    </div>
                </div>
            </Card>
        </Section>
    );
}
