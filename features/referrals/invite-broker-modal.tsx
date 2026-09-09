"use client";

import { type ReactNode, useCallback, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { MessageSquare, Phone, Send, UserRound } from "lucide-react";

import { referralsApi } from "@/lib/api/referrals";
import { buildSmsInviteUrl, buildWhatsAppInviteUrl } from "@/lib/share/referral";
import {
    EMPTY_REFERRAL_INVITE,
    normalizeReferralPhone,
    REFERRAL_NOTE_MAX,
    type ReferralInviteFormValues,
    referralInviteSchema,
} from "@/lib/validation/referral";

import { AppModal } from "@/components/shared/app-modal";
import { AppModalFooter } from "@/components/shared/app-modal-footer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { buildInviteMessage } from "@/features/referrals/referral-meta";
import type { ReferralChannel } from "@/features/referrals/types";

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
    return (
        <label htmlFor={htmlFor} className="body-sm font-medium text-ink">
            {children}
        </label>
    );
}

type InviteBrokerModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** The broker doing the inviting — their name signs the message. */
    inviterName: string;
    shareUrl: string;
    /** Called after the invite is recorded, with the invitee's first name. */
    onInvited: (name: string) => void;
};

/**
 * Invite one broker by number.
 *
 * Two things happen on submit and both matter: the invite is recorded so it
 * can be tracked and credited, and WhatsApp opens on that person's thread with
 * the message ready. Recording without sending leaves a row nobody was told
 * about; sending without recording is an invite that can never earn.
 *
 * The record is written first. If WhatsApp fails to open — an old WebView, a
 * blocked popup — the broker still has a row they can send from the list.
 */
export function InviteBrokerModal({
    open,
    onOpenChange,
    inviterName,
    shareUrl,
    onInvited,
}: InviteBrokerModalProps) {
    const [submitError, setSubmitError] = useState<string | null>(null);

    const {
        control,
        handleSubmit,
        reset,
        formState: { isSubmitting },
    } = useForm<ReferralInviteFormValues>({
        resolver: zodResolver(referralInviteSchema),
        defaultValues: EMPTY_REFERRAL_INVITE,
        // Validation waits for blur — an error on a field nobody has finished
        // typing reads as being told off. docs/MESSAGES.md rule 5.
        mode: "onTouched",
        reValidateMode: "onChange",
    });

    // A reopened modal starts clean. Derived from the open->true edge rather
    // than an effect, which would cascade a second render.
    const [wasOpen, setWasOpen] = useState(open);
    if (open !== wasOpen) {
        setWasOpen(open);
        if (open) {
            reset(EMPTY_REFERRAL_INVITE);
            setSubmitError(null);
        }
    }

    const note = useWatch({ control, name: "note" });
    const previewMessage = buildInviteMessage({ inviterName, shareUrl, note });

    const submit = useCallback(
        async (values: ReferralInviteFormValues, channel: ReferralChannel) => {
            setSubmitError(null);
            const phoneDigits = normalizeReferralPhone(values.phone);

            try {
                await referralsApi.invite({
                    name: values.name,
                    phoneDigits,
                    note: values.note,
                    channel,
                });
            } catch (error) {
                // The API's own sentence when it has one — it knows things the
                // UI does not, like who was already invited.
                setSubmitError(
                    error instanceof Error && error.message
                        ? error.message
                        : "Could not save that invite. Check your connection and try again.",
                );
                return;
            }

            const message = buildInviteMessage({ inviterName, shareUrl, note: values.note });
            const href =
                channel === "sms"
                    ? buildSmsInviteUrl(message, phoneDigits)
                    : buildWhatsAppInviteUrl(message, phoneDigits);

            window.open(href, "_blank", "noopener,noreferrer");

            onInvited(values.name.trim().split(" ")[0]);
            onOpenChange(false);
        },
        [inviterName, onInvited, onOpenChange, shareUrl],
    );

    return (
        <AppModal
            open={open}
            onOpenChange={onOpenChange}
            size="md"
            title="Invite a broker"
            description="We record the invite so you get the credit, then open the message for you to send."
            footer={
                <AppModalFooter
                    primaryLabel={isSubmitting ? "Sending…" : "Send on WhatsApp"}
                    primaryIcon={<MessageSquare aria-hidden />}
                    primaryDisabled={isSubmitting}
                    onPrimary={handleSubmit((values) => submit(values, "whatsapp"))}
                    secondaryLabel="Send by SMS instead"
                    secondaryIcon={<Send aria-hidden />}
                    secondaryDisabled={isSubmitting}
                    onSecondary={handleSubmit((values) => submit(values, "sms"))}
                />
            }
        >
            <div className="flex flex-col gap-4">
                {submitError ? (
                    // Form-level, and it stays. A failed invite in a toast is a
                    // lost error. docs/MESSAGES.md.
                    <p
                        role="alert"
                        className="
                          body-sm rounded-inner border border-danger/25 bg-danger-soft px-3 py-2.5
                          text-danger
                        "
                    >
                        {submitError}
                    </p>
                ) : null}

                <Controller
                    name="name"
                    control={control}
                    render={({ field, fieldState }) => (
                        <div className="flex flex-col gap-2">
                            <FieldLabel htmlFor="referral-name">Their name</FieldLabel>
                            <Input
                                {...field}
                                id="referral-name"
                                placeholder="Kalpesh Chauhan"
                                autoComplete="name"
                                startIcon={UserRound}
                                errorText={fieldState.error?.message}
                            />
                        </div>
                    )}
                />

                <Controller
                    name="phone"
                    control={control}
                    render={({ field, fieldState }) => (
                        <div className="flex flex-col gap-2">
                            <FieldLabel htmlFor="referral-phone">Mobile number</FieldLabel>
                            <Input
                                {...field}
                                id="referral-phone"
                                // `tel` keeps the numeric keypad on Android
                                // without the spinner a number input adds.
                                type="tel"
                                inputMode="numeric"
                                placeholder="98250 14477"
                                autoComplete="tel"
                                startIcon={Phone}
                                errorText={fieldState.error?.message}
                            />
                            <p className="body-xs text-ink-subtle">
                                The number they use on WhatsApp. Paste it straight from your
                                contacts — we tidy up the spacing and country code.
                            </p>
                        </div>
                    )}
                />

                <Controller
                    name="note"
                    control={control}
                    render={({ field, fieldState }) => (
                        <div className="flex flex-col gap-2">
                            <FieldLabel htmlFor="referral-note">
                                Say something in your own words
                            </FieldLabel>
                            <Textarea
                                {...field}
                                id="referral-note"
                                rows={3}
                                placeholder="Optional — leave blank and we write it for you."
                                aria-describedby="referral-note-count"
                            />
                            <p id="referral-note-count" className="body-xs tabular text-ink-subtle">
                                {fieldState.error?.message ??
                                    `${(note ?? "").length} of ${REFERRAL_NOTE_MAX} characters`}
                            </p>
                        </div>
                    )}
                />

                <div className="flex flex-col gap-2 rounded-inner bg-surface-muted p-3">
                    <p className="eyebrow">What they will get</p>
                    {/* The exact text, not a paraphrase. A broker will not
                        send a message they have not read. */}
                    <p className="body-sm whitespace-pre-line text-ink-muted">{previewMessage}</p>
                </div>
            </div>
        </AppModal>
    );
}
