import type { BuyerPropertyKind, BuyerSource } from "@/lib/validation/buyer";

import type { BuyerDocument } from "@/features/contacts/document-rules";

/** What the buyer is after — used to flag a poor match before attaching. */
export type ClientLookingFor = "buy" | "rent" | "both";

/**
 * A buyer or tenant on the broker's own book. Named "client" internally to
 * match the CRM, but shown to brokers as "buyer" — plainer for a
 * non-technical user.
 */
export type ClientItem = {
    id: string;
    name: string;
    avatarUrl?: string;
    phoneDigits: string;
    email: string | null;
    lookingFor: ClientLookingFor;
    /** False when the API omitted a recognised intent; hide the compatibility default. */
    hasRecordedIntent?: boolean;
    propertyKind: BuyerPropertyKind;
    /** Localities the buyer is searching in. */
    preferredLocalities: string[];
    country?: string | null;
    state?: string | null;
    city?: string | null;
    /** Sale budget lower bound, in INR. Null when not stated. */
    budgetMinInr: number | null;
    /** Sale budget upper bound, in INR. Null when not stated. */
    budgetMaxInr: number | null;
    /** Monthly rent budget lower bound, in INR. Null when not stated. */
    rentBudgetMinInr?: number | null;
    /** Monthly rent budget upper bound, in INR. Null when not stated. */
    rentBudgetMaxInr?: number | null;
    /** BHK they want. Null for plots, shops and offices. Kept for API; not collected on create. */
    bhk: number | null;
    source: BuyerSource | null;
    notes: string | null;
    /** ISO instant the broker last spoke to them. Null when never. */
    lastContactedAt: string | null;
    /** How many properties this buyer is already attached to. */
    attachedPropertyCount: number;
    /**
     * KYC papers, loan letters and anything else the broker was sent. Stored
     * with the buyer rather than the deal — a PAN card belongs to the person,
     * not to one property they looked at.
     */
    documents: BuyerDocument[];
};
