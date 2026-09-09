import { z } from "zod";

/**
 * `+91 98250 14477`, `098250 14477`, `9825014477` all become `9825014477`.
 *
 * Brokers paste numbers straight out of their phone's contact list, which
 * carries the country code and spacing. Rejecting those on format would make
 * the form feel broken for the most common way of filling it in.
 */
export function normalizeReferralPhone(value: string): string {
    const digits = value.replace(/\D/g, "");
    if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
    if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
    return digits;
}

/** How much of the broker's own words fits in a WhatsApp opener. */
export const REFERRAL_NOTE_MAX = 200;

/**
 * Validation only — no output transforms, so react-hook-form's generic keeps
 * agreeing with the form values. Normalising happens explicitly on submit.
 * Same reasoning as `lib/validation/buyer.ts`.
 */
export const referralInviteSchema = z.object({
    name: z.string().trim().min(2, "Enter their name").max(80, "Name is too long"),
    phone: z.string().refine(
        // Indian mobile numbers start 6–9. A landline here would mean the
        // WhatsApp invite silently goes nowhere.
        (value) => /^[6-9]\d{9}$/.test(normalizeReferralPhone(value)),
        "Enter a 10-digit mobile number",
    ),
    /** Optional. Empty means the default pitch is used. */
    note: z.string().max(REFERRAL_NOTE_MAX, "Keep it under 200 characters"),
});

export type ReferralInviteFormValues = z.infer<typeof referralInviteSchema>;

export const EMPTY_REFERRAL_INVITE: ReferralInviteFormValues = {
    name: "",
    phone: "",
    note: "",
};
