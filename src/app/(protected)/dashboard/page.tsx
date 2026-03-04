export default function DashboardPage() {
    return (
        <div style={{ padding: 24 }}>
            <h1>Dashboard</h1>
            <p>這頁應該被 session cookie 保護。</p>
            <p>
                <a href="/settings/security">Security</a>
            </p>
            <p>
                <a href="/ticket">Ticket</a>
            </p>
        </div>
    );
}