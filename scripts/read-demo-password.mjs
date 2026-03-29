import fs from "node:fs";
import path from "node:path";

/**
 * Single source of truth: `src/lib/demo-account-password.ts` (DEMO_ACCOUNT_PASSWORD).
 * Scripts read the literal so reset/sync stay aligned without duplicating the secret string.
 */
export function readDemoPasswordFromRepoRoot(repoRoot) {
    const filePath = path.join(repoRoot, "src/lib/demo-account-password.ts");
    const text = fs.readFileSync(filePath, "utf8");
    const match = text.match(/export const DEMO_ACCOUNT_PASSWORD = "([^"]+)"/);
    if (!match) {
        throw new Error(`Could not parse DEMO_ACCOUNT_PASSWORD from ${filePath}`);
    }
    return match[1];
}
