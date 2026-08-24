import type { Metadata } from "next";

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

export default function Page() {
    return (
        <>
            <h1 className="display-md">Notifications</h1>
            <p className="body text-ink-muted">Full notification list — opened from the bell icon.</p>
        </>
    );
}
