import type { ReactNode } from "react";

export function AuthPageShell({ children }: { children: ReactNode }) {
    return (
        <div className="auth-page-shell">
            <main className="auth-page-main">{children}</main>
        </div>
    );
}