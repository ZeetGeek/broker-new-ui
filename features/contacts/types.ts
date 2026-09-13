import type { ClientItem } from "@/features/clients/types";
import type { BuyerContactForm, OwnerContactForm } from "@/features/contacts/contact-form-model";

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
    attachedProperties: Array<{
        id: string;
        leadId: string;
        title: string;
        /** Optional presentation data. Older API responses can omit every field. */
        locality?: string;
        priceLabel?: string;
        coverUrl?: string;
        propertyType?: string;
        configuration?: string;
    }>;
    /** All leads with latest stage — drives the View modal. */
    leads: BuyerLead[];
    /** Full lead-capture fields returned by the contacts API when available. */
    details?: BuyerContactForm;
};

/**
 * An owner the broker represents (or previously represented).
 *
 * Sourced from accepted property representations — owner accepted the broker's
 * request, or the broker accepted the owner's invite. Phone is consent-gated
 * to active representations only.
 */
export type OwnerRow = {
    /** Owner profile id from the API. */
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
    /** Optional card-ready property summaries; deterministic fallbacks cover older responses. */
    properties?: Array<{
        id: string;
        title: string;
        locality?: string;
        priceLabel?: string;
        coverUrl?: string;
        propertyType?: string;
        configuration?: string;
    }>;
    /** Localities they own in, deduped. */
    localities: string[];
    /** Sum of the ask across their properties, in INR. */
    totalValueInr: number;
    /** True when every property of theirs is a rental — drives the /mo suffix. */
    isAllRent: boolean;
    /** Live deals running on their properties. */
    liveDealCount: number;
    /** Platform owners come from an accepted representation; custom owners are broker-created. */
    origin: "platform" | "custom";
    propertyIntent?: "sell" | "rent" | "lease";
    propertyType?: string;
    configuration?: string;
    linkedListingId?: string | null;
    linkedListingTitle?: string | null;
    lastSpokeAt?: string | null;
    status?: string;
    tags?: string[];
    notes?: string;
    /** Complete custom-owner fields. Platform records may omit protected fields. */
    details?: OwnerContactForm;
};

export type ContactsSort = "recent" | "name" | "most_active";

export type ContactsFilters = {
    q: string;
    tab: ContactsTab;
    sort: ContactsSort;
    ownerOrigin: "all" | "platform" | "custom";
};

export type ContactsSummary = {
    buyerCount: number;
    ownerCount: number;
    /** Buyers on no property at all — the ones worth matching to something. */
    unmatchedBuyerCount: number;
    /** Owners whose representation has lapsed everywhere. */
    lapsedOwnerCount: number;
    platformOwnerCount: number;
    customOwnerCount: number;
};

export const DEFAULT_CONTACTS_FILTERS: ContactsFilters = {
    q: "",
    tab: "buyers",
    sort: "recent",
    ownerOrigin: "all",
};
