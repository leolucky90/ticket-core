import { NextResponse } from "next/server";
import { getCheckoutDeferredReceiptSettingsData } from "@/lib/services/merchant/checkout-route-data.service";

export async function GET() {
    const data = await getCheckoutDeferredReceiptSettingsData();
    return NextResponse.json(data);
}
