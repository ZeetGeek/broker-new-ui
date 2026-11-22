"use client";

import { ContactName } from "@/components/shared/contact-name";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import type { OtherBuyer } from "@/features/pipeline/deal-attention";
import { DEAL_STAGE_META } from "@/features/pipeline/stage-meta";

export function MoreBuyersPopover({
    count,
    buyers,
    onView,
}: {
    count: number;
    buyers: OtherBuyer[];
    onView: (dealId: string) => void;
}) {
    const label = `${count} more ${count === 1 ? "client" : "clients"} on this property`;

    return (
        <Popover>
            <PopoverTrigger
                className="
                  body-xs rounded-sm bg-surface-muted px-2 py-0.5 font-medium text-ink
                  hover:bg-brand-soft hover:text-brand-text
                "
                onClick={(event) => event.stopPropagation()}
            >
                {label}
            </PopoverTrigger>
            <PopoverContent align="start" className="gap-2 p-3 inline-64">
                <p className="body-xs font-semibold text-ink">Other clients</p>
                <ul className="flex flex-col gap-1.5">
                    {buyers.map((buyer) => (
                        <li
                            key={buyer.dealId}
                            className="body-sm flex items-center justify-between gap-2 p-1 min-inline-0"
                        >
                            <ContactName
                                name={buyer.name}
                                contactId={buyer.clientId}
                                contactType="buyer"
                                className="flex-1 truncate font-medium min-inline-0"
                            />
                            <button
                                type="button"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    onView(buyer.dealId);
                                }}
                                aria-label={`View ${buyer.name}'s deal`}
                                className="body-xs shrink-0 rounded-sm p-1 text-ink-muted hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-ring"
                            >
                                <span className="body-xs shrink-0 text-ink-muted">
                                    {DEAL_STAGE_META[buyer.stage].label}
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
            </PopoverContent>
        </Popover>
    );
}
