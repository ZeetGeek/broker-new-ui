"use client";

import type { KeyboardEvent } from "react";

import { Building2, Home, Landmark, Plus, Store } from "lucide-react";

import { brokerPropertyDetailHref } from "@/lib/routes/broker";
import { cn } from "@/lib/utils";

import { AppImage } from "@/components/shared/app-image";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import type { ContactPropertyCardItem } from "@/features/contacts/contact-card-model";

const MAX_VISIBLE = 4;

function hashHue(id: string): number {
    let hash = 0;
    for (let index = 0; index < id.length; index += 1) {
        hash = (hash * 31 + id.charCodeAt(index)) >>> 0;
    }
    return 28 + (hash % 128);
}

function PropertyTypeIcon({ type }: { type: string }) {
    const value = type.toLowerCase();
    const Icon = value.includes("plot")
        ? Landmark
        : value.includes("shop") || value.includes("showroom")
          ? Store
          : value.includes("villa") || value.includes("house") || value.includes("bungalow")
            ? Home
            : Building2;
    return <Icon aria-hidden className="relative z-10 block-4.5 inline-4.5" strokeWidth={1.75} />;
}

function handleArrowNavigation(event: KeyboardEvent<HTMLButtonElement>) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    const stack = event.currentTarget.closest<HTMLElement>("[data-property-stack]");
    const tiles = stack?.querySelectorAll<HTMLButtonElement>("[data-property-tile]");
    if (!tiles?.length) return;
    event.preventDefault();
    const current = [...tiles].indexOf(event.currentTarget);
    const next =
        event.key === "Home"
            ? 0
            : event.key === "End"
              ? tiles.length - 1
              : event.key === "ArrowRight"
                ? (current + 1) % tiles.length
                : (current - 1 + tiles.length) % tiles.length;
    tiles[next]?.focus();
}

function PropertyTooltip({ property }: { property: ContactPropertyCardItem }) {
    return (
        <TooltipContent className="flex-col items-start gap-0.5 px-3 py-2.5 text-start">
            <span className="body-xs font-semibold text-ink">{property.title}</span>
            <span className="flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-ink-muted">
                <span>{property.locality}</span>
                <span className="tabular">{property.priceLabel}</span>
            </span>
        </TooltipContent>
    );
}

export type PropertyCoverStackProps = {
    properties: ContactPropertyCardItem[];
    onAttach?: () => void;
    onOpenOverflow?: () => void;
    onOpenProperty?: (property: ContactPropertyCardItem) => void;
    className?: string;
};

export function PropertyCoverStack({
    properties,
    onAttach,
    onOpenOverflow,
    onOpenProperty,
    className,
}: PropertyCoverStackProps) {
    const visible = properties.slice(0, MAX_VISIBLE);
    const overflow = properties.slice(MAX_VISIBLE);

    return (
        <div
            data-property-stack
            className={cn(
                "flex items-center overflow-x-auto px-0.5 py-1.5 [scrollbar-width:none]",
                className,
            )}
            onClick={(event) => event.stopPropagation()}
        >
            {visible.map((property, index) => {
                const hue = hashHue(property.id);
                return (
                    <Tooltip key={property.id}>
                        <TooltipTrigger
                            delay={120}
                            closeDelay={80}
                            render={
                                <button
                                    type="button"
                                    data-property-tile
                                    aria-label={`Open ${property.title}`}
                                    onKeyDown={handleArrowNavigation}
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        if (onOpenProperty) onOpenProperty(property);
                                        else
                                            window.location.assign(
                                                brokerPropertyDetailHref(property.id),
                                            );
                                    }}
                                    className={cn(
                                        `
                                          property-cover-tile relative flex shrink-0 items-center
                                          justify-center overflow-hidden rounded-[12px] text-brand-ink
                                          ring-2 ring-surface block-12 inline-12
                                        `,
                                        index > 0 && "-ms-2.5",
                                    )}
                                    style={{
                                        zIndex: index + 1,
                                        backgroundColor: `hsl(${hue} 48% 78%)`,
                                    }}
                                >
                                    {!property.coverUrl ? (
                                        <PropertyTypeIcon type={property.propertyType} />
                                    ) : null}
                                    {property.coverUrl ? (
                                        <AppImage
                                            src={property.coverUrl}
                                            alt=""
                                            width={48}
                                            height={48}
                                            quality={70}
                                            sizes="48px"
                                            fallbackSrc="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="
                                            className="absolute inset-0 block-full inline-full"
                                        />
                                    ) : null}
                                </button>
                            }
                        />
                        <PropertyTooltip property={property} />
                    </Tooltip>
                );
            })}

            {overflow.length > 0 ? (
                <Tooltip>
                    <TooltipTrigger
                        delay={120}
                        closeDelay={80}
                        render={
                            <button
                                type="button"
                                data-property-tile
                                aria-label={`Show ${overflow.length} more properties`}
                                onKeyDown={handleArrowNavigation}
                                onClick={(event) => {
                                    event.stopPropagation();
                                    onOpenOverflow?.();
                                }}
                                className="
                                  property-cover-tile body-xs relative -ms-2.5 flex shrink-0
                                  items-center justify-center rounded-[12px] bg-surface-muted
                                  font-semibold text-ink-muted ring-2 ring-surface block-12 inline-12
                                "
                                style={{ zIndex: visible.length + 1 }}
                            >
                                +{overflow.length}
                            </button>
                        }
                    />
                    <TooltipContent className="flex-col items-start gap-1 px-3 py-2.5 text-start">
                        {overflow.slice(0, 6).map((property) => (
                            <span key={property.id} className="body-xs text-ink">
                                {property.title}
                            </span>
                        ))}
                        {overflow.length > 6 ? (
                            <span className="body-xs text-ink-muted">
                                and {overflow.length - 6} more
                            </span>
                        ) : null}
                    </TooltipContent>
                </Tooltip>
            ) : null}

            {onAttach ? (
                <Tooltip>
                    <TooltipTrigger
                        render={
                            <button
                                type="button"
                                data-property-tile
                                aria-label="Attach property"
                                onKeyDown={handleArrowNavigation}
                                onClick={(event) => {
                                    event.stopPropagation();
                                    onAttach();
                                }}
                                className={cn(
                                    `
                                      property-cover-tile relative flex shrink-0 items-center
                                      justify-center rounded-[12px] border border-dashed
                                      border-brand/45 bg-brand-soft/45 text-brand-text block-10
                                      inline-10
                                    `,
                                    (visible.length > 0 || overflow.length > 0) && "-ms-2.5",
                                )}
                                style={{ zIndex: visible.length + (overflow.length ? 2 : 1) }}
                            >
                                <Plus aria-hidden className="block-4 inline-4" strokeWidth={2} />
                            </button>
                        }
                    />
                    <TooltipContent>Attach property</TooltipContent>
                </Tooltip>
            ) : null}
        </div>
    );
}
