import type { ReactNode } from "react";
import { ProtectedShell } from "@/components/layout/ProtectedShell";

type CustomerDashboardLayoutProps = {
    children: ReactNode;
};

export default function CustomerDashboardLayout({ children }: CustomerDashboardLayoutProps) {
    return <ProtectedShell>{children}</ProtectedShell>;
}
