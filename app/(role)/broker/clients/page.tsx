import type { Metadata } from "next";

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

export default function Page() {
    return (
        <>
            <h1 className="display-md">Clients</h1>
            <p className="body text-ink-muted">
                Pipeline — kanban on desktop, stage tabs on mobile.
            </p>
        </>
    );
}
