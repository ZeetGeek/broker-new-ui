import type { Metadata } from "next";
import { Suspense } from "react";

import { PipelinePage } from "@/features/pipeline/pipeline-page";

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

export default function Page() {
    return (
        <Suspense fallback={<p className="body text-ink-muted">Loading Pipeline…</p>}>
            <PipelinePage />
        </Suspense>
    );
}
