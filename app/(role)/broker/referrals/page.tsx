import type { Metadata } from "next";

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

export default function Page() {
    return (
        <>
            <h1 className="display-md">Referrals & Credits</h1>
            <p className="body text-ink-muted">
                Invite other brokers and track referral credits earned.
            </p>
        </>
    );
}
