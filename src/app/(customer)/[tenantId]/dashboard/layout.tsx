import type { ReactNode } from "react";
import { ProtectedShell } from "@/components/layout/ProtectedShell";

type TenantCustomerDashboardLayoutProps = {
    children: ReactNode;
};

export default function TenantCustomerDashboardLayout({ children }: TenantCustomerDashboardLayoutProps) {
    return <ProtectedShell>{children}</ProtectedShell>;
}
