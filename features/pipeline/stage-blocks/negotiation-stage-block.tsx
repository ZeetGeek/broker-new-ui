import { formatPrice, formatRent } from "@/lib/format/price";
import { cn } from "@/lib/utils";

import { IconButton } from "@/components/shared/icon-button";
import { CircleCheck, CircleX, Clock, HandCoins, Pencil, Plus } from "@/components/shared/icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { FEATURE_PLATFORM_OWNER } from "@/config";
import { OFFER_STATUS_LABEL } from "@/features/pipeline/stage-meta";
import type { DealItem } from "@/features/pipeline/types";

import styles from "../deal-card.module.css";

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
    const compactStatus = OFFER_STATUS_LABEL[deal.offerStatus ?? "pending"];
    const StatusIcon = accepted ? CircleCheck : rejected ? CircleX : Clock;
    const ActionIcon = offer == null ? Plus : Pencil;
    const actionLabel = offer == null ? "Record offer" : "Update recorded offer";

    return (
        <div
            className={cn(
                styles.negotiationBlock,
                "rounded-inner border p-2.5",
                FEATURE_PLATFORM_OWNER && rejected
                    ? "border-danger/15 bg-danger-soft/40 text-danger"
                    : "border-stage-4-soft/70 bg-stage-4-soft/15 text-brand-text",
            )}
        >
            <HandCoins aria-hidden strokeWidth={1.75} className="shrink-0 block-4.5 inline-4.5" />
            {offer == null ? (
                <p className={cn("body-xs font-medium text-ink", styles.stageInfo)}>No offer yet</p>
            ) : (
                <Tooltip>
                    <TooltipTrigger
                        render={
                            <span
                                tabIndex={0}
                                className={cn(
                                    "body-xs rounded-sm text-ink focus-visible:outline-2 focus-visible:outline-ring",
                                    styles.stageInfo,
                                    styles.offerLine,
                                )}
                            />
                        }
                    >
                        <span className={styles.offerLabel}>
                            {FEATURE_PLATFORM_OWNER ? "Offer" : "Recorded offer"}
                        </span>
                        <span className="body-sm tabular shrink-0 font-semibold">
                            {deal.property.isRent ? formatRent(offer) : formatPrice(offer)}
                        </span>
                    </TooltipTrigger>
                    <TooltipContent>{offerGap(deal.property.amountInr, offer)}</TooltipContent>
                </Tooltip>
            )}
            {onMakeOffer && (!FEATURE_PLATFORM_OWNER || offer == null) ? (
                <Tooltip>
                    <TooltipTrigger
                        render={
                            <IconButton
                                size="sm"
                                tone="brand"
                                aria-label={actionLabel}
                                className={styles.stageControl}
                                onClick={(event) => {
                                    event.stopPropagation();
                                    onMakeOffer();
                                }}
                            />
                        }
                    >
                        <ActionIcon aria-hidden strokeWidth={1.75} className="block-4 inline-4" />
                    </TooltipTrigger>
                    <TooltipContent>{actionLabel}</TooltipContent>
                </Tooltip>
            ) : null}
            {FEATURE_PLATFORM_OWNER && offer != null && status ? (
                <Tooltip>
                    <TooltipTrigger
                        render={
                            <span tabIndex={0} className={styles.offerStatus} aria-label={status} />
                        }
                    >
                        <StatusIcon aria-hidden className="block-4 inline-4" />
                        <span className="sr-only">{compactStatus}</span>
                    </TooltipTrigger>
                    <TooltipContent>{status}</TooltipContent>
                </Tooltip>
            ) : null}
        </div>
    );
}
