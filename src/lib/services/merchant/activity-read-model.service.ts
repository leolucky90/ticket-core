import "server-only";
import { listActivities, queryActivitiesPage } from "@/lib/services/commerce";

// Canonical read-side import path for merchant activity/promotion dashboards.
// The underlying implementation still lives in `commerce.ts` until CRUD extraction is complete.
export { listActivities, queryActivitiesPage };
