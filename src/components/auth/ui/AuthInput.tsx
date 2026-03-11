export function AuthInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
    const { className, ...rest } = props;
    return <input className={className ? `auth-input ${className}` : "auth-input"} {...rest} />;
}
