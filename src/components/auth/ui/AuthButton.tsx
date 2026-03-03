export function AuthButton(
    props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "primary" },
) {
    const { variant = "default", ...rest } = props;
    return (
        <button
            className={variant === "primary" ? "auth-btn auth-btn-primary" : "auth-btn"}
            {...rest}
        />
    );
}