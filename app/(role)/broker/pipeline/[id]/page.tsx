import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PipelinePage } from "@/features/pipeline/pipeline-page";

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    if (id === "new") redirect("/broker/contacts?add=buyer");
    return <PipelinePage key={id} initialLeadId={id} />;
}
