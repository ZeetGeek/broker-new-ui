"use client";

import { formatPhoneIn, formatTelUrl, formatWhatsAppUrl } from "@/lib/format/phone";
import { cn } from "@/lib/utils";

import { CallIcon, WhatsAppIcon } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import styles from "./property-card.module.css";

/** Bottom bar for broker inventory: WhatsApp (outline) + Call (brand). */
export function PropertyOwnerContactActions({
    ownerName,
    ownerPhoneDigits,
}: {
    ownerName: string;
    ownerPhoneDigits?: string | null;
}) {
    const digits = ownerPhoneDigits?.replace(/\D/g, "") ?? "";
    const canContact = digits.length >= 10;
    const phoneLabel = canContact ? formatPhoneIn(digits) : null;
    const tip = phoneLabel ?? "Attach an owner with a phone number first";

    return (
        <div
            className={cn("pointer-events-auto", styles.contactActions)}
            onClick={(event) => event.stopPropagation()}
        >
            <Tooltip>
                <TooltipTrigger
                    render={
                        canContact ? (
                            <Button
                                variant="outline"
                                size="md"
                                nativeButton={false}
                                className={styles.contactButton}
                                render={
                                    <a
                                        href={formatWhatsAppUrl(digits)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={`WhatsApp ${ownerName} at ${phoneLabel}`}
                                    />
                                }
                            />
                        ) : (
                            <Button
                                variant="outline"
                                size="md"
                                type="button"
                                disabled
                                className={styles.contactButton}
                                aria-label="WhatsApp unavailable — attach an owner first"
                            />
                        )
                    }
                >
                    <WhatsAppIcon
                        aria-hidden
                        strokeWidth={1.75}
                        className="shrink-0 block-4.5 inline-4.5"
                    />
                    WhatsApp
                </TooltipTrigger>
                <TooltipContent side="top">{tip}</TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger
                    render={
                        canContact ? (
                            <Button
                                variant="accent"
                                size="md"
                                nativeButton={false}
                                className={styles.contactButton}
                                render={
                                    <a
                                        href={formatTelUrl(digits)}
                                        aria-label={`Call owner ${ownerName} at ${phoneLabel}`}
                                    />
                                }
                            />
                        ) : (
                            <Button
                                variant="accent"
                                size="md"
                                type="button"
                                disabled
                                className={styles.contactButton}
                                aria-label="Call owner unavailable — attach an owner first"
                            />
                        )
                    }
                >
                    <CallIcon
                        aria-hidden
                        strokeWidth={1.75}
                        className="shrink-0 block-4.5 inline-4.5"
                    />
                    Call Owner
                </TooltipTrigger>
                <TooltipContent side="top">{tip}</TooltipContent>
            </Tooltip>
        </div>
    );
}
