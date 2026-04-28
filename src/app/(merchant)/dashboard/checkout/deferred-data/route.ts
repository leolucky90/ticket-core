import { NextResponse } from "next/server";
import { getCheckoutRouteDeferredData } from "@/lib/services/merchant/checkout-route-data.service";

export async function GET() {
    const data = await getCheckoutRouteDeferredData();
    return NextResponse.json(data);
}
