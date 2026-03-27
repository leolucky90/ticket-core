import Link from "next/link";

export default function NotFound() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-16 text-slate-900">
            <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">404</p>
                <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">找不到這個頁面</h1>
                <p className="mt-3 text-base leading-7 text-slate-600">
                    這個網址可能已失效、被移動，或是你目前沒有權限查看。
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
                    >
                        回到首頁
                    </Link>
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                        前往後台
                    </Link>
                </div>
            </div>
        </main>
    );
}
