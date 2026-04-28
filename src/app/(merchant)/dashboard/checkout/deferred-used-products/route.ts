import { NextResponse } from "next/server";
import { getCheckoutDeferredUsedProductsData } from "@/lib/services/merchant/checkout-route-data.service";

export async function GET() {
    const data = await getCheckoutDeferredUsedProductsData();
    return NextResponse.json(data);
}
