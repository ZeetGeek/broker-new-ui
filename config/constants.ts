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

/** WhatsApp support line — replace when a real number is assigned. */
export const SUPPORT_WHATSAPP_E164 = "919824000000";

export const SUPPORT_WHATSAPP_URL = `https://wa.me/${SUPPORT_WHATSAPP_E164}`;
