import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";

export async function GET() {
    return NextResponse.json({
        message: "Firebase Admin working",
    });
}