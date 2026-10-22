"use client";

import { Mail, Phone } from "@/components/shared/icons";

import { PhoneNumber } from "@/components/shared/phone-number";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const ICON_CLASS = "block-3 inline-3";
const META_TEXT = "body-sm font-medium text-ink-muted";

export function hasPhoneNumber(phoneDigits: string) {
    return phoneDigits.replace(/\D/g, "").slice(-10).length === 10;
}

export function DashboardContactLine({
    phoneDigits,
    email,
}: {
    phoneDigits: string;
    email: string;
}) {
    const showPhone = hasPhoneNumber(phoneDigits);

    if (!showPhone && !email) {
        return null;
    }

    return (
        <div className={`inline-flex items-center gap-2 ${META_TEXT}`}>
            {showPhone ? (
                <>
                    <Tooltip>
                        <TooltipTrigger
                            render={
                                <span className="inline-flex items-center gap-1">
                                    <Phone aria-hidden className={ICON_CLASS} strokeWidth={1.75} />
                                    <PhoneNumber phoneDigits={phoneDigits} />
                                </span>
                            }
                        />
                        <TooltipContent side="bottom">Your phone number</TooltipContent>
                    </Tooltip>
                    {email ? (
                        <span aria-hidden className="text-ink-subtle">
                            ·
                        </span>
                    ) : null}
                </>
            ) : null}
            {email ? (
                <Tooltip>
                    <TooltipTrigger
                        render={
                            <span className="inline-flex items-center gap-1">
                                <Mail aria-hidden className={ICON_CLASS} strokeWidth={1.75} />
                                <span className="truncate max-inline-[28ch]">{email}</span>
                            </span>
                        }
                    />
                    <TooltipContent side="bottom">Your email</TooltipContent>
                </Tooltip>
            ) : null}
        </div>
    );
}
