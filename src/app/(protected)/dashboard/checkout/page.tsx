import { CheckoutWorkspace } from "@/components/dashboard/CheckoutWorkspace";
import { Section } from "@/components/ui/section";
import { createCheckoutSale } from "@/lib/services/sales";
import { listActivities, listCompanyCustomers, listProducts } from "@/lib/services/commerce";
import { listTickets } from "@/lib/services/ticket";

type CheckoutPageProps = {
    searchParams: Promise<{ flash?: string; ts?: string; customerId?: string }>;
};

export default async function DashboardCheckoutPage({ searchParams }: CheckoutPageProps) {
    const sp = await searchParams;
    const [customers, tickets, products, activities] = await Promise.all([
        listCompanyCustomers(),
        listTickets(),
        listProducts(),
        listActivities(),
    ]);
    const activeActivities = activities.filter((activity) => activity.status === "active");

    return (
        <Section title="結帳">
            <CheckoutWorkspace
                customers={customers}
                tickets={tickets}
                products={products}
                activeActivities={activeActivities}
                createCheckoutAction={createCheckoutSale}
                flash={(sp.flash ?? "").trim()}
                actionTs={(sp.ts ?? "").trim()}
                initialCustomerId={(sp.customerId ?? "").trim()}
            />
        </Section>
    );
}
