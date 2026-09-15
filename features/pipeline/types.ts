/**
 * The four funnel stages a deal moves through. These are the stages the
 * `--color-stage-1` … `--color-stage-4` tokens are named for in
 * `app/globals.css`; adding a fifth means adding a colour, which
 * §1.3 of docs/DESIGN.md limits to these four.
 */
export type DealStage = "new" | "contacted" | "visit" | "negotiation";

/**
 * How a deal ended. Kept off the board on purpose — a column that only ever
 * grows is not a stage, it is an archive. Closed and lost deals leave the
 * funnel and are read from the "Done" view instead.
 */
export type DealOutcome = "closed" | "lost";

export type DealStatus = DealStage | DealOutcome;

/** Why a deal was lost. Drives the one honest sentence on an archived card. */
export type DealLostReason = "price" | "bought_elsewhere" | "not_responding" | "changed_mind";

/**
 * The owner side of a deal, denormalized onto it. The broker entered none of
 * this — it came from the owner's own listing, through an approved
 * representation. See AGENTS.md, "the core loop".
 */
export type DealOwner = {
    name: string;
    avatarUrl?: string;
    /**
     * Consent-gated, exactly as on `RequestItem`. The API only sends a number
     * once the owner has approved the broker for this property. A deal whose
     * representation lapsed shows the owner's name and no way to call them.
     */
    phoneDigits?: string;
    /** False once representation ends — the card stops offering contact. */
    isRepresentationActive: boolean;
};

/** The property side, also denormalized from the owner's listing. */
export type DealProperty = {
    id: string;
    title: string;
    configLabel: string;
    propertyTypeLabel: string;
    locality: string;
    city: string;
    areaSqft: number;
    bhk: number;
    /** Ask in INR — rent when `isRent`, else sale. */
    amountInr: number;
    isRent: boolean;
    imageSrc: string;
    /**
     * Total photos on the listing. Optional — absent means the payload did not
     * say, which is not the same as zero, so the gallery count stays hidden.
     */
    photoCount?: number;
};

/** The buyer side. Mirrors `ClientItem`, trimmed to what a card renders. */
export type DealBuyer = {
    id: string;
    name: string;
    avatarUrl?: string;
    phoneDigits: string;
    /** Upper bound of what they will pay, in INR. Null when not stated. */
    budgetMaxInr: number | null;
};

/**
 * One buyer working on one property. The unit of the pipeline.
 *
 * A buyer looking at three properties is three deals, because they can be at
 * three different stages — keen on one, cold on another. Collapsing them to a
 * single card would force the board to lie about two of them.
 */
export type DealItem = {
    id: string;
    status: DealStatus;
    buyer: DealBuyer;
    property: DealProperty;
    owner: DealOwner;
    /** ISO instant the deal entered its current stage. Drives "stalled". */
    stageEnteredAt: string;
    /** ISO instant of the last call, visit or message. Null when never. */
    lastContactedAt: string | null;
    /** ISO instant of the next scheduled visit. Null when none booked. */
    nextVisitAt: string | null;
    /** Free-text note the broker typed. Empty string when none. */
    note: string;
    /** Set only when `status` is "lost". */
    lostReason?: DealLostReason;
    /** ISO instant the deal was closed or lost. Null while live. */
    resolvedAt: string | null;
    /** What the deal actually closed at, in INR. Null unless closed. */
    closedAmountInr: number | null;
    /** Latest offer amount in INR. Null when none submitted. */
    offerAmountInr: number | null;
    /** Owner response on the latest offer. Null when no offer yet. */
    offerStatus: "pending" | "accepted" | "rejected" | null;
    /** When the lead was created. Optional — hide "Added N days ago" if missing. */
    createdAt?: string | null;
    /** How the buyer arrived. Optional — hide the source chip if missing. */
    source?: DealSource;
    /** How the last contact happened. Optional — hide the method if missing. */
    lastContactMethod?: DealContactMethod;
    /** ISO instant of the next follow-up. Optional — hide if missing. */
    nextFollowUpAt?: string | null;
    /**
     * Teammate currently working this deal, when the account is an
     * organization with a team. Optional — hide the "Handled by" line when
     * absent, and also when it matches the signed-in broker.
     */
    assignedAgent?: DealAssignedAgent | null;
};

/** A teammate a deal is assigned to. See `DealItem.assignedAgent`. */
export type DealAssignedAgent = {
    id: string;
    name: string;
    avatarUrl?: string;
};

/** One stage-change entry from the API `stageHistory` array. */
export type DealHistoryEntry = {
    status: string;
    at: string | null;
    note: string | null;
    by: string | null;
};

/** Full lead payload for the View modal (board card + history + extras). */
export type DealDetail = DealItem & {
    /** API stage string before UI mapping (e.g. offer_made, site_visit). */
    apiStage: string | null;
    listPriceInr: number | null;
    createdAt: string | null;
    updatedAt: string | null;
    buyerEmail: string | null;
    history: DealHistoryEntry[];
};

export type DealsFilters = {
    q: string;
    /** "" means every live stage. Terminal states use the `done` view. */
    stage: DealStage | "";
    sort: DealSort;
    dealType: DealTypeFilter;
    locality: string;
    ownerName: string;
};

export type DealSort = "recent" | "stalled" | "price_desc" | "price_asc" | "visit_soon";

export type DealsView = "board" | "done";

export type DealBoardLayout = "board" | "list";

export type PipelineSummaryChip = "running" | "in_play" | "quiet" | "finished";

export type DealTypeFilter = "" | "rent" | "sale";

export type DealSource = "website" | "walk_in" | "reference";

export type DealContactMethod = "call" | "whatsapp" | "visit";

export type StageCounts = Record<DealStage, number>;

export type DealsSummary = {
    counts: StageCounts;
    /** Live deals across all four stages. */
    liveTotal: number;
    /** Deals with no contact for `STALLED_AFTER_DAYS` or more. */
    stalledCount: number;
    /** Deals with a visit booked from now on. */
    upcomingVisitCount: number;
    /** Sum of the ask across every live deal, in INR. */
    liveValueInr: number;
    closedCount: number;
    lostCount: number;
    /** Closed ÷ resolved, as a percent 0–100. */
    winRate: number;
};

export type DealsResult = {
    items: DealItem[];
    summary: DealsSummary;
};

export const DEFAULT_DEALS_FILTERS: DealsFilters = {
    q: "",
    stage: "",
    sort: "recent",
    dealType: "",
    locality: "",
    ownerName: "",
};

/**
 * Days without contact before a deal is called stalled. Two weeks is the
 * number the broker dashboard already uses for its stalled count, and two
 * places disagreeing about what "gone quiet" means would be worse than the
 * number being slightly wrong.
 */
export const SLOW_AFTER_DAYS = 7;

export const STALLED_AFTER_DAYS = 14;

/** Board order. Also the order a deal advances through. */
export const DEAL_STAGE_ORDER: DealStage[] = ["new", "contacted", "visit", "negotiation"];

/** The stage after this one, or null at the end of the funnel. */
export function nextStage(stage: DealStage): DealStage | null {
    const index = DEAL_STAGE_ORDER.indexOf(stage);
    return DEAL_STAGE_ORDER[index + 1] ?? null;
}

export function isLiveStage(status: DealStatus): status is DealStage {
    return (DEAL_STAGE_ORDER as DealStatus[]).includes(status);
}
