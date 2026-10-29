import type { DealStage } from "@/features/pipeline/types";

export function pipelineStageFromQuery(value: string | null): DealStage | null {
    if (value === "site_visit" || value === "visit") return "visit";
    if (value === "offer_made" || value === "negotiation") return "negotiation";
    if (value === "new" || value === "contacted") return value;
    return null;
}
