import { redirect } from "next/navigation";

export default async function SecurityPage() {
    redirect("/settings/security/delete-control");
}
