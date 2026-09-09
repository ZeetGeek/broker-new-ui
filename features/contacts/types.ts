import type { ClientItem } from "@/features/clients/types";

export type ContactsTab = "buyers" | "owners";

export type BuyerLead = {
    leadId: string;
    propertyId: string;
    title: string;
    city: string;
    /** Raw stage from the API (e.g. new, offer_made, closed_won). */
    stage: string;
    updatedAt: string | null;
    offerAmountInr: number | null;
    listPriceInr: number | null;
    closedAmountInr: number | null;
    isRent: boolean;
};

/**
 * A buyer row, plus the deal context that only the pipeline knows about.
 * `ClientItem` is the stored record; this is what the list actually renders.
 */
export type BuyerRow = ClientItem & {
    /** Properties this buyer is on right now, across every live stage. */
    liveDealCount: number;
    /** Deals that ended in a sale. The reason to call this buyer first. */
    closedDealCount: number;
    /** Localities of the properties they are actually being shown. */
    activePropertyTitles: string[];
    /** Live attachments — used for deep-links and the attach modal. */
    attachedProperties: Array<{ id: string; leadId: string; title: string }>;
    /** All leads with latest stage — drives the View modal. */
    leads: BuyerLead[];
};

/**
 * An owner, assembled from the properties the broker represents.
 *
 * Owners have no store of their own here on purpose: the broker never creates
 * one, and an owner with no property is not a contact the broker has any
 * business holding. Every owner on this list is derived from a real
 * representation, which is also what decides whether their number is visible.
 */
export type OwnerRow = {
    /** Stable per owner — derived from their name until the API sends an id. */
    id: string;
    name: string;
    avatarUrl?: string;
    /**
     * Consent-gated. Present only while at least one representation with this
     * owner is still active. Never rendered from a lapsed relationship.
     */
    phoneDigits?: string;
    /** True when any property of theirs is still represented by this broker. */
    hasActiveRepresentation: boolean;
    /** How many of their properties the broker is working. */
    propertyCount: number;
    /** Titles of those properties, for the secondary line. */
    propertyTitles: string[];
    /** Localities they own in, deduped. */
    localities: string[];
    /** Sum of the ask across their properties, in INR. */
    totalValueInr: number;
    /** True when every property of theirs is a rental — drives the /mo suffix. */
    isAllRent: boolean;
    /** Live deals running on their properties. */
    liveDealCount: number;
};

export type ContactsSort = "recent" | "name" | "most_active";

export type ContactsFilters = {
    q: string;
    tab: ContactsTab;
    sort: ContactsSort;
};

export type ContactsSummary = {
    buyerCount: number;
    ownerCount: number;
    /** Buyers on no property at all — the ones worth matching to something. */
    unmatchedBuyerCount: number;
    /** Owners whose representation has lapsed everywhere. */
    lapsedOwnerCount: number;
};

export const DEFAULT_CONTACTS_FILTERS: ContactsFilters = {
    q: "",
    tab: "buyers",
    sort: "recent",
};
