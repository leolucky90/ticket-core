import Link from "next/link";
import { cookies } from "next/headers";
import { getUiLanguage, getUiText } from "@/lib/i18n/ui-text";

export default async function NotFound() {
    const lang = getUiLanguage((await cookies()).get("lang")?.value);
    const ui = getUiText(lang).notFoundPage;

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-16 text-slate-900">
            <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">404</p>
                <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">{ui.title}</h1>
                <p className="mt-3 text-base leading-7 text-slate-600">
                    {ui.description}
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
                    >
                        {ui.backHome}
                    </Link>
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                        {ui.goDashboard}
                    </Link>
                </div>
            </div>
        </main>
    );
}
