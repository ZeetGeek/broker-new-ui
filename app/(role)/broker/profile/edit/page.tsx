import type { Metadata } from "next";

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

export default function Page() {
    return (
        <>
            <h1 className="display-md">Edit profile</h1>
            <p className="body text-ink-muted">
                Update RERA number, service areas, and contact details.
            </p>
        </>
    );
}
