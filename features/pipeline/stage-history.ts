import { CALL_LOGGED_NOTE } from "@/lib/api/pipeline";
import { formatPrice, formatRent } from "@/lib/format/price";

import { DEAL_OUTCOME_META, DEAL_STAGE_META } from "@/features/pipeline/stage-meta";
import type { DealHistoryEntry } from "@/features/pipeline/types";

/** `stage`: the lead moved. `call` / `note`: logged without moving the card. */
export type StageHistoryRowKind = "stage" | "call" | "note";

export type StageHistoryRow = {
    kind: StageHistoryRowKind;
    /** API status, for the icon. */
    status: string;
    title: string;
    note: string | null;
    /** "You" for the broker reading this, "Owner" for the owner. */
    actor: string | null;
    at: string | null;
};

/** Same words the board uses, so the timeline never says "Closed won". */
const STAGE_TITLE: Record<string, string> = {
    new: DEAL_STAGE_META.new.label,
    contacted: DEAL_STAGE_META.contacted.label,
    site_visit: DEAL_STAGE_META.visit.label,
    negotiation: DEAL_STAGE_META.negotiation.label,
    offer_made: "Offer made",
    offer_rejected: "Offer rejected",
    closed_won: DEAL_OUTCOME_META.closed.label,
    closed_lost: DEAL_OUTCOME_META.lost.label,
};

/** Plain label for an API lead stage ("closed_won" → "Closed"). */
export function stageTitle(status: string): string {
    return STAGE_TITLE[status] ?? humanize(status);
}

const ACTOR_LABEL: Record<string, string> = { broker: "You", owner: "Owner" };

function humanize(value: string): string {
    const words = value.replace(/_/g, " ").trim();
    return words.charAt(0).toUpperCase() + words.slice(1).toLowerCase();
}

/** The API writes offer amounts as raw rupees ("₹4500000"). Show them in lakh/crore. */
function readableNote(note: string | null, isRent: boolean): string | null {
    if (!note) return null;
    return note.replace(/₹\s?(\d{4,})(?![\d,.])/g, (_, digits: string) =>
        isRent ? formatRent(Number(digits)) : formatPrice(Number(digits)),
    );
}

/**
 * Stage history for the deal sheet, newest first. Logging a call or saving a
 * note writes a same-stage entry to the API; those read as "Call logged" /
 * "Note added", never as the deal moving to the stage it is already in.
 */
export function describeStageHistory(
    history: DealHistoryEntry[],
    { isRent }: { isRent: boolean },
): StageHistoryRow[] {
    let currentStage: string | null = null;
    const rows = history.map((entry): StageHistoryRow => {
        const actor = entry.by ? (ACTOR_LABEL[entry.by.toLowerCase()] ?? humanize(entry.by)) : null;
        const note = readableNote(entry.note, isRent);
        const inPlace = entry.status === currentStage || entry.status === "note";

        if (inPlace) {
            const isCall = entry.note === CALL_LOGGED_NOTE;
            return {
                kind: isCall ? "call" : "note",
                status: entry.status,
                title: isCall ? CALL_LOGGED_NOTE : "Note added",
                note: isCall ? null : note,
                actor,
                at: entry.at,
            };
        }

        if (
            Object.prototype.hasOwnProperty.call(STAGE_TITLE, entry.status) &&
            entry.status !== "offer_rejected"
        ) {
            currentStage = entry.status;
        }
        return {
            kind: "stage",
            status: entry.status,
            title: stageTitle(entry.status),
            note,
            actor,
            at: entry.at,
        };
    });
    return rows.reverse();
}
