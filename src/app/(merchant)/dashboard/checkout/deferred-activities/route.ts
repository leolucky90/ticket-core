import { NextResponse } from "next/server";
import { getCheckoutDeferredActivitiesData } from "@/lib/services/merchant/checkout-route-data.service";

export async function GET() {
    const data = await getCheckoutDeferredActivitiesData();
    return NextResponse.json(data);
}
