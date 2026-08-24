import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

export default function Page() {
    return (
        <div className="flex items-center justify-between gap-4">
            <div>
                <h1 className="display-md">Profile</h1>
                <p className="body text-ink-muted">RERA details and service areas.</p>
            </div>
            <Link
                href="/broker/profile/edit"
                className="body-sm rounded-full border border-border-warm px-4 py-2 font-semibold text-ink"
            >
                Edit profile
            </Link>
        </div>
    );
}
