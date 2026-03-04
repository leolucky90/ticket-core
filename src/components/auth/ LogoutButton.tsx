"use client";

import { AuthButton } from "@/components/auth/ui/AuthButton";
import { auth } from "@/lib/firebase/client";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

export function LogoutButton({ label }: { label: string }) {
    const router = useRouter();
    return (
        <AuthButton
            type="button"
            onClick={async () => {
                await signOut(auth);
                await fetch("/api/auth/session", { method: "DELETE" });
                router.replace("/");
                router.refresh();
            }}
        >
            {label}
        </AuthButton>
    );
}