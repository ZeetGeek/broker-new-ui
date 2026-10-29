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

/** Reminders a broker may send the owner on one pending request. */
export const REPRESENTATION_REMINDER_LIMIT = 2;

/** Only configure this after the support team has verified the destination. */
export function supportWhatsAppUrl(number: string | undefined): string | null {
    const digits = number?.trim().replace(/^\+/, "");
    return digits && /^[1-9]\d{7,14}$/.test(digits) ? `https://wa.me/${digits}` : null;
}

export const SUPPORT_WHATSAPP_URL = supportWhatsAppUrl(
    process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP_E164,
);
