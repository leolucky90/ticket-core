import { NextResponse } from "next/server";
import { markCurrentStaffPasswordChanged } from "@/lib/services/staff.service";

export async function POST() {
    try {
        await markCurrentStaffPasswordChanged();
        return NextResponse.json({ ok: true });
    } catch (error) {
        const message = error instanceof Error ? error.message : "PASSWORD_CHANGE_SYNC_FAILED";
        return NextResponse.json({ error: message }, { status: 400 });
    }
}

