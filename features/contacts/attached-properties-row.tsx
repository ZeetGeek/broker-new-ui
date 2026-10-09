"use client";

import { cn } from "@/lib/utils";

import { OVERLAY_GLASS_BUTTON_CLASS } from "@/components/shared/overlay-card";
import { PropertyThumb } from "@/components/shared/property-thumb";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import type { ContactPropertyCardItem } from "@/features/contacts/contact-card-model";

const MAX_VISIBLE = 3;

function PropertyCoverTile({ property }: { property: ContactPropertyCardItem }) {
    return (
        <PropertyThumb
            src={property.coverUrl}
            alt=""
            hoverScale={false}
            sizes="36px"
            iconClassName="block-4 inline-4"
            sizeClassName="block-9 inline-9"
            className="rounded-[8px] shadow-xs ring-2 ring-surface transition-transform duration-160 group-hover/tile:-translate-y-0.5"
        />
    );
}

/**
 * Same layout language as AttachedBuyersRow on listing cards — stacked covers,
 * count, and titles — so a buyer’s linked properties read at a glance.
 */
export function AttachedPropertiesRow({
    properties,
    onManage,
}: {
    properties: ContactPropertyCardItem[];
    onManage?: () => void;
}) {
    if (properties.length === 0) return null;

    const visible = properties.slice(0, MAX_VISIBLE);
    const overflow = properties.slice(MAX_VISIBLE);
    const title = properties.length === 1 ? "1 property" : `${properties.length} properties`;

    const content = (
        <>
            <TooltipProvider>
                <div className="flex shrink-0 items-center">
                    {visible.map((property, index) => (
                        <Tooltip key={property.id}>
                            <TooltipTrigger
                                render={
                                    <span
                                        className={cn(
                                            "group/tile relative inline-flex",
                                            index > 0 && "-ms-2.5",
                                        )}
                                    >
                                        <PropertyCoverTile property={property} />
                                    </span>
                                }
                            />
                            <TooltipContent side="top" className="flex-col items-start gap-0.5">
                                <span className="font-semibold">{property.title}</span>
                                <span className="text-ink-muted">
                                    {property.locality}
                                    {property.priceLabel ? ` · ${property.priceLabel}` : ""}
                                </span>
                            </TooltipContent>
                        </Tooltip>
                    ))}
                    {overflow.length > 0 ? (
                        <Tooltip>
                            <TooltipTrigger
                                render={
                                    <span
                                        className="
                                          body-xs relative -ms-2.5 inline-flex items-center
                                          justify-center rounded-[8px] bg-ink font-sans font-semibold
                                          text-surface shadow-xs ring-2 ring-surface block-9
                                          inline-9
                                        "
                                    >
                                        +{overflow.length}
                                    </span>
                                }
                            />
                            <TooltipContent side="top">
                                {overflow.map((property) => property.title).join(", ")}
                            </TooltipContent>
                        </Tooltip>
                    ) : null}
                </div>
            </TooltipProvider>

            <span className="body-sm min-inline-0 truncate font-semibold tracking-wide text-ink">
                {title}
            </span>
        </>
    );

    if (onManage) {
        return (
            <button
                type="button"
                onClick={onManage}
                className={cn(
                    `
                      flex items-center gap-2.5 px-3 py-2.5 text-start transition-colors
                      duration-160 inline-full rounded-control
                    `,
                    OVERLAY_GLASS_BUTTON_CLASS,
                )}
            >
                {content}
            </button>
        );
    }

    return (
        <div
            className={cn(
                "flex items-center gap-2.5 px-3 py-2.5 rounded-control",
                OVERLAY_GLASS_BUTTON_CLASS,
            )}
        >
            {content}
        </div>
    );
}
