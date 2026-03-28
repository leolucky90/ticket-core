import "server-only";
import { listActivityPurchases, listCompanyCustomers, queryCompanyCustomersPage } from "@/lib/services/commerce";

// Canonical read-side import path for merchant customer relationship data.
// Keep callers off `commerce.ts` directly so later extraction stays low-risk.
export { listActivityPurchases, listCompanyCustomers, queryCompanyCustomersPage };
