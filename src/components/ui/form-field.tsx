import type { HTMLAttributes, LabelHTMLAttributes, ReactNode } from "react";
import { cn } from "@/components/ui/cn";

type FieldLabelProps = LabelHTMLAttributes<HTMLLabelElement> & {
    required?: boolean;
};

export function FieldLabel({ className, required = false, children, ...props }: FieldLabelProps) {
    return (
        <label className={cn("text-xs font-medium text-[rgb(var(--text))]", className)} {...props}>
            <span>{children}</span>
            {required ? (
                <span className="ml-1 text-[rgb(var(--accent))]" aria-hidden="true">
                    *
                </span>
            ) : null}
        </label>
    );
}

type FieldHintProps = HTMLAttributes<HTMLParagraphElement>;

export function FieldHint({ className, ...props }: FieldHintProps) {
    return <p className={cn("text-xs text-[rgb(var(--muted))]", className)} {...props} />;
}

type FormFieldProps = {
    label: string;
    htmlFor?: string;
    required?: boolean;
    hint?: string;
    children: ReactNode;
    className?: string;
    labelClassName?: string;
};

export function FormField({ label, htmlFor, required = false, hint, children, className, labelClassName }: FormFieldProps) {
    return (
        <div className={cn("grid min-w-0 gap-1.5", className)}>
            <FieldLabel htmlFor={htmlFor} required={required} className={labelClassName}>
                {label}
            </FieldLabel>
            {children}
            {hint ? <FieldHint>{hint}</FieldHint> : null}
        </div>
    );
}
