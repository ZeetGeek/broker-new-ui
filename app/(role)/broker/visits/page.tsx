import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

export default function Page() {
    return (
        <div className="flex items-center justify-between gap-4">
            <div>
                <h1 className="display-md">Site visits</h1>
                <p className="body text-ink-muted">Calendar of scheduled visits.</p>
            </div>
            <Link
                href="/broker/visits/new"
                className="body-sm rounded-full bg-brand-ink px-4 py-2 font-semibold text-white"
            >
                Schedule visit
            </Link>
        </div>
    );
}
