import { z } from "zod";

export const exclusiveOwnerTypeSchema = z.enum(["individual", "builder", "company"]);
export const exclusiveOwnerSourceSchema = z.enum([
    "referral",
    "walk_in",
    "portal",
    "social",
    "repeat",
    "other",
]);

export const exclusiveOwnerFormSchema = z.object({
    fullName: z.string().trim().min(2, "Enter the owner's full name"),
    phone: z
        .string()
        .trim()
        .refine((value) => /^[6-9]\d{9}$/.test(value.replace(/\D/g, "").slice(-10)), {
            message: "Enter a valid 10-digit mobile number",
        }),
    email: z
        .string()
        .trim()
        .refine((value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), {
            message: "Enter a valid email address",
        }),
    ownerType: exclusiveOwnerTypeSchema,
    /** Optional — society is no longer collected on Add owner. */
    society: z.string().trim().optional().or(z.literal("")),
    area: z.string().trim().optional().or(z.literal("")),
    country: z.string().trim().min(1, "Pick a country"),
    state: z.string().trim().min(1, "Pick a state"),
    city: z.string().trim().min(1, "Pick a city"),
    pincode: z
        .string()
        .trim()
        .optional()
        .or(z.literal(""))
        .refine((value) => !value || /^\d{6}$/.test(value), {
            message: "Enter a 6-digit pincode",
        }),
    fullAddress: z.string().trim().optional().or(z.literal("")),
    reraNumber: z.string().trim().optional().or(z.literal("")),
    source: exclusiveOwnerSourceSchema.or(z.literal("")).optional(),
    notes: z.string().trim().optional().or(z.literal("")),
});

export type ExclusiveOwnerFormValues = z.infer<typeof exclusiveOwnerFormSchema>;

export function normalizeExclusiveOwnerPhone(value: string): string {
    const digits = value.replace(/\D/g, "");
    if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
    if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
    return digits.slice(-10);
}
