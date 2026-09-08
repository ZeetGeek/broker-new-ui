import type { Metadata } from "next";

import { PipelinePage } from "@/features/pipeline/pipeline-page";

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

export default function Page() {
    return <PipelinePage />;
}
