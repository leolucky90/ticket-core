import Link from "next/link";
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
            <div className="grid max-w-3xl gap-4">
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
                {accountType === "company" ? (
                    <Card>
                        <div className="grid gap-2">
                            <div className="text-sm font-medium">屬性設置</div>
                            <div className="text-sm text-[rgb(var(--muted))]">管理案件狀態與報價狀態，支援新增、移除與修改後寫入伺服器。</div>
                            <div>
                                <Link
                                    href="/settings/account/attributes"
                                    className="inline-flex items-center rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--panel2))] px-4 py-2 text-sm"
                                >
                                    前往屬性設置
                                </Link>
                            </div>
                        </div>
                    </Card>
                ) : null}
            </div>
        </Section>
    );
}
