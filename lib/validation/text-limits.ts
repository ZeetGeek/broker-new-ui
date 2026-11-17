/**
 * Max characters for free-text note fields, sized to the job each one does.
 *
 * A one-line reason gets a short limit; a field meant for call notes gets
 * room. Tune a limit here and the field's `maxLength`, its counter, and its
 * validation all follow.
 *
 * Older limits that already had a home stay there: `BIO_MAX`
 * (lib/validation/profile.ts), `REFERRAL_NOTE_MAX` (lib/validation/referral.ts),
 * and the property address / description limits (lib/properties/form-limits.ts).
 */
export const MAX_CHARS = {
    /** Note logged when a deal moves stage — one line for the deal history. */
    pipelineStageNote: 300,
    /** Running note on a deal — what was said on the last call. */
    dealNote: 500,
    /** Terms next to a client's offer ("cash buyer, closes in 30 days"). */
    offerNote: 200,
    /** Notes on a client or owner contact. */
    contactNote: 300,
    /** What the client said after a site visit. */
    visitFeedback: 500,
    /** Why a proposed visit time works better. */
    visitTimeRequestMessage: 150,
    /** Meeting point or reminder on a scheduled visit. */
    visitNote: 300,
    /** Follow-up note after a completed visit. */
    visitCompletedNote: 500,
    /** Why a visit did not happen. */
    visitMissedReason: 200,
    /** Details on a task. */
    taskDetails: 1000,
    /** Why a listing was marked sold. */
    markSoldReason: 200,
    /** Why a representation was ended. */
    endRepresentationReason: 200,
    /** Note sent with an owner's invite to a broker. */
    brokerInviteNote: 300,
} as const;
