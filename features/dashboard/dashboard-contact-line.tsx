"use client";

import { Mail, Phone } from "@/components/shared/icons";
import { InfoTip, InfoTipContent, InfoTipTrigger } from "@/components/shared/info-tip";
import { PhoneNumber } from "@/components/shared/phone-number";

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
                    <InfoTip>
                        <InfoTipTrigger
                            nativeButton={false}
                            render={
                                <span className="inline-flex items-center gap-1">
                                    <Phone aria-hidden className={ICON_CLASS} strokeWidth={1.75} />
                                    <PhoneNumber phoneDigits={phoneDigits} />
                                </span>
                            }
                        />
                        <InfoTipContent side="bottom">Your phone number</InfoTipContent>
                    </InfoTip>
                    {email ? (
                        <span aria-hidden className="text-ink-subtle">
                            ·
                        </span>
                    ) : null}
                </>
            ) : null}
            {email ? (
                <InfoTip>
                    <InfoTipTrigger
                        nativeButton={false}
                        render={
                            <span className="inline-flex items-center gap-1">
                                <Mail aria-hidden className={ICON_CLASS} strokeWidth={1.75} />
                                <span className="truncate max-inline-[28ch]">{email}</span>
                            </span>
                        }
                    />
                    <InfoTipContent side="bottom">Your email</InfoTipContent>
                </InfoTip>
            ) : null}
        </div>
    );
}
