import { Icon } from "@iconify/react";

import { formatPrice } from "@/lib/format/price";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import type { DealItem } from "@/features/pipeline/types";

function offerGap(askInr: number, offerInr: number): string {
    const delta = offerInr - askInr;
    if (delta === 0) return "Matches asking price";
    return `${formatPrice(Math.abs(delta))} ${delta > 0 ? "above" : "below"} asking price`;
}

export function NegotiationStageBlock({
    deal,
    onMakeOffer,
}: {
    deal: DealItem;
    onMakeOffer?: () => void;
}) {
    const offer = deal.offerAmountInr;
    const rejected = deal.offerStatus === "rejected";
    const accepted = deal.offerStatus === "accepted";
    const status = accepted
        ? "Owner accepted the offer"
        : rejected
          ? "Owner declined the offer"
          : deal.offerStatus === "pending"
            ? "Waiting for owner's response"
            : null;

    const compactStatus = accepted ? "Accepted" : rejected ? "Declined" : "Awaiting owner";

    return (
        <div
            className={cn(
                "flex items-center gap-2.5 rounded-inner border px-3 py-1 min-block-10",
                rejected
                    ? "border-danger/15 bg-danger-soft/40 text-danger"
                    : "border-stage-4-soft/70 bg-stage-4-soft/15 text-brand-text",
            )}
        >
            <Icon
                icon="tabler:heart-handshake"
                aria-hidden
                className="shrink-0 block-4.5 inline-4.5"
            />
            {offer == null ? (
                <p className="body-xs flex-1 font-medium text-ink min-inline-0">No offer yet</p>
            ) : (
                <Tooltip>
                    <TooltipTrigger
                        render={
                            <span
                                tabIndex={0}
                                className="body-xs flex-1 truncate rounded-sm font-semibold text-ink min-inline-0 focus-visible:outline-2 focus-visible:outline-ring"
                            />
                        }
                    >
                        Offer <span className="tabular">{formatPrice(offer)}</span>
                    </TooltipTrigger>
                    <TooltipContent>{offerGap(deal.property.amountInr, offer)}</TooltipContent>
                </Tooltip>
            )}
            {offer == null && onMakeOffer ? (
                <Button
                    variant="link"
                    size="sm"
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation();
                        onMakeOffer();
                    }}
                    className="px-0 text-xs text-brand-text"
                >
                    Add offer
                </Button>
            ) : null}
            {offer != null && status ? (
                <span
                    className="body-xs flex shrink-0 items-center gap-1.5 whitespace-nowrap"
                    title={status}
                    aria-label={status}
                >
                    <Icon
                        icon={
                            accepted
                                ? "tabler:circle-check"
                                : rejected
                                  ? "tabler:circle-x"
                                  : "tabler:clock-hour-4"
                        }
                        aria-hidden
                        className="block-3.5 inline-3.5"
                    />
                    {compactStatus}
                </span>
            ) : null}
        </div>
    );
}
