import { z } from "zod";

import { MAX_BUYERS_PER_VISIT } from "@/lib/visits/constants";

export const bookingSchema = z.object({
    buyerIds: z
        .array(z.string())
        .min(1, "Choose at least one buyer.")
        .max(MAX_BUYERS_PER_VISIT, `Choose up to ${MAX_BUYERS_PER_VISIT} buyers.`),
    acceptTight: z.boolean(),
});

export type BookingFormValues = z.infer<typeof bookingSchema>;

export const timeRequestSchema = z.object({
    propertyId: z.string().min(1, "Choose a property."),
    buyerIds: z.array(z.string()).min(1, "Choose at least one buyer.").max(MAX_BUYERS_PER_VISIT),
    preferredStartsAt: z.string().min(1, "Choose a preferred time."),
    alternates: z.array(z.string()).max(2),
    message: z.string().max(240, "Keep the message within 240 characters."),
});

export type TimeRequestFormValues = z.infer<typeof timeRequestSchema>;

export const outcomeSchema = z.object({
    attended: z.enum(["buyer_and_owner", "buyer_only", "nobody"]),
    interest: z.enum(["hot", "warm", "cold"]),
    objections: z.array(z.string()),
    offerAmount: z.number().optional(),
    feedback: z.string().max(500),
    nextStep: z.enum(["move_to_negotiation", "schedule_followup", "show_other_property", "drop"]),
    followUpAt: z.string().optional(),
});

export type OutcomeFormValues = z.infer<typeof outcomeSchema>;
