import { Card } from "@/components/ui/card";

export function DashboardPanel() {
    return (
        <Card>
            <div className="space-y-2">
                <h1 className="text-2xl font-semibold">Dashboard</h1>
                <p className="text-sm text-[rgb(var(--muted))]">你已登入成功，左側邊欄可切換功能頁面。</p>
            </div>
        </Card>
    );
}
