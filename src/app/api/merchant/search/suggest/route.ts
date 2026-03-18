import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-enterprise/session.server";
import { getShowcaseTenantId, getUserDoc, toAccountType } from "@/lib/services/user.service";
import { getPredictiveSearchSuggestions } from "@/lib/services/predictiveSearch";
import type { PredictiveSearchTarget } from "@/lib/types/search";

const ALLOWED_TARGETS: PredictiveSearchTarget[] = ["products", "inventory", "customers", "tickets", "checkout_items"];

function parseTargets(rawList: string[]): PredictiveSearchTarget[] {
    const split = rawList.flatMap((item) => item.split(","));
    const normalized = split.map((item) => item.trim()).filter((item): item is PredictiveSearchTarget => ALLOWED_TARGETS.includes(item as PredictiveSearchTarget));
    return Array.from(new Set(normalized));
}

export async function GET(req: Request) {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userDoc = await getUserDoc(session.uid);
    if (toAccountType(userDoc?.role ?? null) !== "company") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const tenantId = getShowcaseTenantId(userDoc, session.uid);
    if (!tenantId) return NextResponse.json({ error: "Missing company tenant id" }, { status: 400 });

    const url = new URL(req.url);
    const query = url.searchParams.get("q")?.trim() ?? "";
    const targets = parseTargets(url.searchParams.getAll("targets"));
    const limit = Number(url.searchParams.get("limit") ?? "");

    const result = await getPredictiveSearchSuggestions({
        query,
        targets: targets.length > 0 ? targets : undefined,
        limit: Number.isFinite(limit) ? limit : undefined,
    });

    return NextResponse.json({
        ok: true,
        tenantId,
        ...result,
    });
}
