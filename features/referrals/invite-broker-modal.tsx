"use client";

import { type ReactNode, useCallback, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { MessageSquare, Phone, Send, UserRound } from "lucide-react";

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
 * Share the referral link to one contact.
 *
 * Credits are earned when they register with the code and finish setup — the
 * backend has no "create invite by phone" write API, so this modal only opens
 * WhatsApp/SMS. The person appears under Your invites after they sign up.
 */
export function InviteBrokerModal({
    open,
    onOpenChange,
    inviterName,
    shareUrl,
    onInvited,
}: InviteBrokerModalProps) {
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
        }
    }

    const note = useWatch({ control, name: "note" });
    const previewMessage = buildInviteMessage({ inviterName, shareUrl, note });

    const submit = useCallback(
        (values: ReferralInviteFormValues, channel: ReferralChannel) => {
            const phoneDigits = normalizeReferralPhone(values.phone);
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
            description="Opens a message with your invite link. They show up here after they sign up with your code."
            footer={
                <AppModalFooter
                    primaryLabel={isSubmitting ? "Opening…" : "Send on WhatsApp"}
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
