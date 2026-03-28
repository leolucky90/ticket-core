import type { ButtonHTMLAttributes, ReactNode } from "react";
import { ProcessingIndicator } from "@/components/ui/processing-indicator";

export function AuthButton(
    props: ButtonHTMLAttributes<HTMLButtonElement> & {
        variant?: "default" | "primary";
        loading?: boolean;
        loadingLabel?: ReactNode;
    },
) {
    const { variant = "default", loading = false, loadingLabel, disabled, children, ...rest } = props;
    return (
        <button
            className={variant === "primary" ? "auth-btn auth-btn-primary" : "auth-btn"}
            disabled={disabled || loading}
            {...rest}
        >
            {loading ? (
                <ProcessingIndicator
                    label={loadingLabel ?? children}
                    spinnerClassName="text-current"
                    labelClassName="text-current"
                />
            ) : (
                children
            )}
        </button>
    );
}
