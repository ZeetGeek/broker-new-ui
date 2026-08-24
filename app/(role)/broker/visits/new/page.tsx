import type { Metadata } from "next";

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

export default function Page() {
    return (
        <>
            <h1 className="display-md">Schedule a visit</h1>
            <p className="body text-ink-muted">
                Pick a client and property to schedule a site visit.
            </p>
        </>
    );
}
