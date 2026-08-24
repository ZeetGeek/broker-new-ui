import type { Metadata } from "next";

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

export default function Page() {
    return <h1 className="display-md">Owner</h1>;
}
