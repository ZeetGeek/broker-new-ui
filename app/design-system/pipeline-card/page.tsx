import type { Metadata } from "next";

import { PipelineCardPreview } from "@/features/design-system/pipeline-card-preview";

export const metadata: Metadata = {
    title: "Pipeline card",
    robots: { index: false, follow: false },
};

/**
 * Visual reference for the pipeline deal card across every state it has to
 * survive: missing photo, lapsed representation, extreme price widths, long
 * names, and each funnel stage. Not linked from the app — it exists so the
 * card can be reviewed without a signed-in board behind it.
 */
export default function PipelineCardPreviewPage() {
    return <PipelineCardPreview />;
}
