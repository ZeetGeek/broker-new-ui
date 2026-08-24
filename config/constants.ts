/**
 * Provisional pipeline stages for UI only.
 * Exact names/count are still an open product question — do not treat as final.
 */
export const PIPELINE_STAGES = [
    { id: "new", label: "New" },
    { id: "contacted", label: "Contacted" },
    { id: "site_visit", label: "Site visit" },
    { id: "negotiation", label: "Negotiation" },
    { id: "closed_won", label: "Closed won" },
] as const;

export type PipelineStageId = (typeof PIPELINE_STAGES)[number]["id"];
