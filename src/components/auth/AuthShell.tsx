import { AuthCard } from "@/components/auth/ui/AuthCard";

export function AuthShell({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <AuthCard>
            <div className="auth-stack">
                <div className="auth-head">
                    <div className="auth-title">{title}</div>
                    <div className="ui-muted auth-sub">
                        Enterprise Auth · Session Cookie · RBAC-ready
                    </div>
                </div>
                {children}
            </div>
        </AuthCard>
    );
}