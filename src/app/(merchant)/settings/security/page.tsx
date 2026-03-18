import { redirect } from "next/navigation";

export default async function SecurityPage() {
    redirect("/settings/dashboard");
}
