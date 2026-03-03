import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session.server";
import { getUserDoc } from "@/lib/services/user.service";

export async function GET() {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ session: null, user: null });

    const user = await getUserDoc(session.uid);
    return NextResponse.json({ session, user });
}