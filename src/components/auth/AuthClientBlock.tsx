"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { EmailAuthForm } from "@/components/auth/EmailAuthForm";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { startNavigationProgress } from "@/components/layout/navigation-progress";
import { firebaseClientConfigError, firebaseClientReady } from "@/lib/firebase-client/client";
import { normalizeAuthTenantId, normalizeTenantId } from "@/lib/tenant-scope";

type Labels = Parameters<typeof EmailAuthForm>[0]["labels"];
type AuthMode = "signIn" | "signUp";
type SignUpAccountType = "customer" | "company";

function toServerErrorCode(input: unknown, fallback: string): string {
    if (typeof input !== "string") return fallback;
    const normalized = input.trim();
    return normalized || fallback;
}

export function AuthClientBlock({
    labels,
    googleLabel,
    modeOverride,
    signUpAccountType = "customer",
    tenantContextId,
    firebaseAuthTenantId,
    showGoogle = true,
}: {
    labels: Labels;
    googleLabel: string;
    modeOverride?: AuthMode;
    signUpAccountType?: SignUpAccountType;
    tenantContextId?: string | null;
    firebaseAuthTenantId?: string | null;
    showGoogle?: boolean;
}) {
    const router = useRouter();
    const sp = useSearchParams();
    const next = sp.get("next");
    const mode = modeOverride ?? (sp.get("mode") === "signUp" ? "signUp" : "signIn");
    const tenantId = normalizeTenantId(tenantContextId ?? sp.get("tenant"));
    const authTenantId = normalizeAuthTenantId(firebaseAuthTenantId ?? sp.get("authTenant"));

    async function createSession(idToken: string, scopedTenantId: string | null): Promise<Response> {
        return fetch("/api/auth/session", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                idToken,
                tenantId: scopedTenantId ?? undefined,
                authTenantId: authTenantId ?? undefined,
            }),
        });
    }

    async function onAuthed(idToken: string) {
        if (mode === "signUp") {
            const roleResponse = await fetch("/api/auth/register-profile", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    idToken,
                    accountType: signUpAccountType,
                    tenantId: tenantId ?? undefined,
                    authTenantId: authTenantId ?? undefined,
                }),
            });
            if (!roleResponse.ok) {
                const payload = (await roleResponse.json().catch(() => null)) as { error?: unknown } | null;
                throw new Error(`server/${toServerErrorCode(payload?.error, "REGISTER_PROFILE_FAILED")}`);
            }
        }

        let sessionResponse = await createSession(idToken, tenantId);
        if (!sessionResponse.ok) {
            const payload = (await sessionResponse.json().catch(() => null)) as { error?: string } | null;
            // Company account signed in from tenant entry: retry without tenant scope.
            if (tenantId && payload?.error === "TENANT_LOGIN_FORBIDDEN") {
                sessionResponse = await createSession(idToken, null);
            }
        }
        if (!sessionResponse.ok) {
            const payload = (await sessionResponse.json().catch(() => null)) as { error?: unknown } | null;
            throw new Error(`server/${toServerErrorCode(payload?.error, "SESSION_CREATE_FAILED")}`);
        }
        const sessionPayload = (await sessionResponse.json().catch(() => null)) as
            | { mustChangePassword?: boolean; googleLinked?: boolean }
            | null;

        let fallbackPath = tenantId ? `/${encodeURIComponent(tenantId)}/dashboard` : "/customer-dashboard";
        const bootstrapResponse = await fetch("/api/auth/bootstrap", { method: "POST" });
        if (bootstrapResponse.ok) {
            const payload = (await bootstrapResponse.json().catch(() => null)) as
                | { user?: { role?: string | null } | null; accountType?: "company" | "customer" | null; tenantId?: string | null }
                | null;
            const resolvedTenantId = normalizeTenantId(payload?.tenantId ?? null);
            if (payload?.accountType === "company") {
                fallbackPath = "/dashboard";
            } else if (resolvedTenantId) {
                fallbackPath = `/${encodeURIComponent(resolvedTenantId)}/dashboard`;
            }
        }
        if (sessionPayload?.mustChangePassword) {
            fallbackPath = "/account/security?forcePasswordReset=1";
        }

        startNavigationProgress();
        router.replace(next || fallbackPath);
        router.refresh();
    }

    return (
        <div className="auth-actions">
            {!firebaseClientReady ? (
                <div className="auth-error">
                    {firebaseClientConfigError ?? "Firebase 前端設定異常，暫時無法登入。"}
                    <br />
                    請在部署環境補上 `NEXT_PUBLIC_FIREBASE_API_KEY`、`NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`、
                    `NEXT_PUBLIC_FIREBASE_PROJECT_ID`、`NEXT_PUBLIC_FIREBASE_APP_ID`。
                </div>
            ) : null}
            <EmailAuthForm
                labels={labels}
                onAuthed={onAuthed}
                initialMode={mode}
                showModeSwitch={false}
                signUpAccountType={signUpAccountType}
                signUpTenantId={tenantId}
                firebaseAuthTenantId={authTenantId}
                disabled={!firebaseClientReady}
            />
            {showGoogle ? (
                <GoogleAuthButton
                    label={googleLabel}
                    onAuthed={onAuthed}
                    firebaseAuthTenantId={authTenantId}
                    disabled={!firebaseClientReady}
                />
            ) : null}
        </div>
    );
}
