import { z } from "zod";

/**
 * Strips formatting from a typed mobile number. Input arrives with spaces,
 * `+91`, or a leading zero far too often to reject on that alone.
 */
export function normalizeBuyerPhone(value: string): string {
    const digits = value.replace(/\D/g, "");
    if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
    if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
    return digits;
}

/** Digits only, for a budget typed as `85,00,000` or `₹8500000`. */
export function normalizeBuyerBudget(value: string): string {
    return value.replace(/[^\d]/g, "");
}

/** Splits the comma-separated locality field into a clean list. */
export function parseBuyerLocalities(value: string): string[] {
    return value
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);
}

/** What the buyer wants. Mirrors the property categories they will be shown. */
export const buyerPropertyKindSchema = z.enum([
    "apartment",
    "villa",
    "plot",
    "shop",
    "office",
    "any",
]);

/** Where the buyer came from, so the broker knows what is working. */
export const buyerSourceSchema = z.enum([
    "referral",
    "walk_in",
    "portal",
    "social",
    "repeat",
    "other",
]);

export type BuyerPropertyKind = z.infer<typeof buyerPropertyKindSchema>;
export type BuyerSource = z.infer<typeof buyerSourceSchema>;

const budgetAmount = z.string().refine((value) => {
    const digits = normalizeBuyerBudget(value);
    return digits === "" || Number(digits) > 0;
}, "Enter an amount above zero");

function budgetPairInOrder(min: string, max: string) {
    const low = normalizeBuyerBudget(min);
    const high = normalizeBuyerBudget(max);
    if (low === "" || high === "") return true;
    return Number(high) >= Number(low);
}

/**
 * Validation only — deliberately no output transforms.
 *
 * react-hook-form types the form against the schema's *input*, so a schema
 * that transforms strings into numbers makes the resolver's generic disagree
 * with the form's own values and submission silently never fires. Parsing to
 * the stored shape happens explicitly on submit instead, using the helpers
 * above.
 */
export const buyerFormSchema = z
    .object({
        name: z.string().trim().min(2, "Enter the client's name").max(80, "Name is too long"),
        phone: z
            .string()
            .refine(
                (value) => /^[6-9]\d{9}$/.test(normalizeBuyerPhone(value)),
                "Enter a 10-digit mobile number",
            ),
        /** Optional — many buyers in this market have no email at all. */
        email: z
            .string()
            .refine(
                (value) => value.trim() === "" || z.email().safeParse(value.trim()).success,
                "Enter a valid email, or leave it blank",
            ),
        lookingFor: z.enum(["buy", "rent", "both"]),
        /** Kept for API payload — not shown on the create form (defaults to any). */
        propertyKind: buyerPropertyKindSchema,
        country: z.string().trim().min(1, "Pick a country"),
        state: z.string().trim().min(1, "Pick a state"),
        city: z.string().trim().min(1, "Pick a city"),
        localities: z
            .string()
            .refine((value) => parseBuyerLocalities(value).length > 0, "Add at least one area"),
        /** Empty is allowed — a buyer who has not named a number is still worth saving. */
        saleBudgetMin: budgetAmount,
        saleBudgetMax: budgetAmount,
        rentBudgetMin: budgetAmount,
        rentBudgetMax: budgetAmount,
        /** Empty string means "any" — kept for API; not shown on the create form. */
        bhk: z.string(),
        source: buyerSourceSchema,
        note: z.string().max(300, "Note is too long"),
    })
    .superRefine((values, ctx) => {
        if (
            values.lookingFor !== "rent" &&
            !budgetPairInOrder(values.saleBudgetMin, values.saleBudgetMax)
        ) {
            ctx.addIssue({
                code: "custom",
                message: "Highest must be more than lowest",
                path: ["saleBudgetMax"],
            });
        }
        if (
            values.lookingFor !== "buy" &&
            !budgetPairInOrder(values.rentBudgetMin, values.rentBudgetMax)
        ) {
            ctx.addIssue({
                code: "custom",
                message: "Highest must be more than lowest",
                path: ["rentBudgetMax"],
            });
        }
    });

export type BuyerFormValues = z.infer<typeof buyerFormSchema>;
