import type { Metadata } from "next";

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

export default function Page() {
    return (
        <>
            <h1 className="display-md">Dashboard</h1>
            <p className="body text-ink-muted">
                Pipeline snapshot, recent requests, and upcoming visits at a glance.
            </p>
        </>
    );
}
