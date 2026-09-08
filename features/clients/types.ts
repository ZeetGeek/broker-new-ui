import type { BuyerPropertyKind, BuyerSource } from "@/lib/validation/buyer";

import type { BuyerDocument } from "@/features/contacts/document-rules";

/** What the buyer is after — used to flag a poor match before attaching. */
export type ClientLookingFor = "buy" | "rent";

/**
 * A buyer or tenant on the broker's own book. Named "client" internally to
 * match the CRM, but shown to brokers as "buyer" — plainer for a
 * non-technical user.
 */
export type ClientItem = {
    id: string;
    name: string;
    phoneDigits: string;
    email: string | null;
    lookingFor: ClientLookingFor;
    propertyKind: BuyerPropertyKind;
    /** Localities the buyer is searching in. */
    preferredLocalities: string[];
    /** Lower bound of what they will pay, in INR. Null when not stated. */
    budgetMinInr: number | null;
    /** Upper bound of what they will pay, in INR. Null when not stated. */
    budgetMaxInr: number | null;
    /** BHK they want. Null for plots, shops and offices. */
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
