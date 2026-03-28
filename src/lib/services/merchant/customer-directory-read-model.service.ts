import "server-only";
import { listCompanyCustomers } from "@/lib/services/commerce";

// Compatibility-backed customer directory entry point.
// New customer summary/detail flows should import from this file instead of `commerce.ts`.
export { listCompanyCustomers };
