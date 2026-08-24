import type { Metadata } from "next";

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    return (
        <>
            <h1 className="display-md">Client {id}</h1>
            <p className="body text-ink-muted">Timeline, follow-ups, and WhatsApp go here.</p>
        </>
    );
}
