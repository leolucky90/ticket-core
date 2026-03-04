import { AuthCard } from "@/components/auth/ui/AuthCard";

export function AuthShell({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <AuthCard>
            <div className="auth-stack">
                <div className="auth-head">
                    <div className="auth-title">{title}</div>
                    <div className="auth-muted auth-sub">Email Verify · Google · Session Cookie</div>
                </div>
                {children}
            </div>
        </AuthCard>
    );
}