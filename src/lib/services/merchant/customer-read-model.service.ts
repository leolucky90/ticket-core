import "server-only";
import { listActivityPurchases } from "@/lib/services/merchant/activity-purchase-read-model.service";
import { listCompanyCustomers } from "@/lib/services/merchant/customer-directory-read-model.service";
import { queryCompanyCustomersPage } from "@/lib/services/merchant/customer-summary-read-model.service";

// Canonical read-side import path for merchant customer relationship data.
// Keep callers off `commerce.ts` directly so later extraction stays low-risk.
export { listActivityPurchases, listCompanyCustomers, queryCompanyCustomersPage };
