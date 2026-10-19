"use client";

import type { ReactNode } from "react";

import { MapPin, Maximize2 } from "lucide-react";

import { cn } from "@/lib/utils";

import { MarqueeText } from "@/components/shared/marquee-text";
import { OverlayCardPhotos } from "@/components/shared/overlay-card-photos";
import { PropertyTitleLink } from "@/components/shared/property-title-link";
import { UserAvatar } from "@/components/shared/user-avatar";

/*
 * Property listing card: clear photo on top, white essentials panel below.
 * Cards stretch to the row height (`flex-1`); the panel grows and the CTA
 * sits at the bottom via `OverlayCardActions` / `mbs-auto`.
 */
const CARD_CLASS = `
  group/marquee relative isolate flex flex-1 transform-gpu flex-col overflow-hidden rounded-card
  bg-surface shadow-md transition-[box-shadow] duration-160 inline-full
  hover:shadow-lg
`;
const SWEEP_CLASS = `
  pointer-events-none absolute inset-y-0 inset-s-[-40%] inline-[40%]
  bg-linear-to-r from-transparent via-surface/35 to-transparent
  motion-safe:animate-card-sweep
`;
const PHOTO_CLASS = "relative aspect-4/3 shrink-0 overflow-hidden inline-full";
// Panel ignores the pointer so taps open the listing; links/buttons opt back in.
const PANEL_CLASS = `
  pointer-events-none relative z-10 flex flex-1 flex-col gap-4 px-4 py-4 text-ink
  [&_a]:pointer-events-auto [&_button]:pointer-events-auto
`;
const PRICE_CLASS = "h5 font-semibold tracking-wide tabular-nums text-brand";
const HEADLINE_CLASS = "body font-semibold tracking-wide text-ink capitalize hover:text-ink";
const META_LINE_CLASS =
    "body-sm flex items-center gap-1.5 tracking-wide text-ink-muted min-inline-0";
/** Owner/broker credit — no hairline; space comes from panel rhythm. */
const PERSON_CLASS = `
  body-sm flex items-center gap-2 tracking-wide text-ink-muted min-inline-0
`;

/** Round glass icon button for the top-right corner of the photo. 48px hit area. */
export const OVERLAY_ICON_BUTTON_CLASS = `
  pointer-events-auto relative rounded-full bg-ink/30 text-surface backdrop-blur-md block-10
  inline-10
  after:absolute after:-inset-1
  hover:bg-ink/45 hover:text-surface
  aria-expanded:bg-ink/45 aria-expanded:text-surface
`;

/** Secondary outline button on the light panel (primary stays `accent`). */
export const OVERLAY_GLASS_BUTTON_CLASS = `
  border border-ink/15 bg-surface font-semibold text-ink
  hover:border-ink/30 hover:bg-surface-muted hover:text-ink
`;

/** Divided row of small label/value pairs — keep for deal/owned extras only. */
export function OverlayStatsRow({ children }: { children: ReactNode }) {
    return (
        <div
            className="
              grid auto-cols-fr grid-flow-col divide-x divide-border-warm border-bs
              border-border-warm pbs-3
            "
        >
            {children}
        </div>
    );
}

export function OverlayStat({
    label,
    hint,
    children,
}: {
    label: string;
    /** Optional smaller line under the value, e.g. a phone number. */
    hint?: ReactNode;
    children: ReactNode;
}) {
    return (
        <div className="flex flex-col gap-0.5 px-3 min-inline-0 first:ps-0 last:pe-0">
            <span className="body-xs truncate tracking-wide text-ink-muted">{label}</span>
            <span className="body-sm truncate font-semibold tracking-wide text-ink tabular-nums">
                {children}
            </span>
            {hint ? (
                <span className="body-xs truncate tracking-wide text-ink-muted tabular-nums">
                    {hint}
                </span>
            ) : null}
        </div>
    );
}

/**
 * Price (optional secondary price) → what it is → where.
 * Pass `price` when the price row needs custom markup (tooltips, dual prices).
 */
export function OverlayCardSummary({
    href,
    priceLabel,
    price,
    headline,
    locationLabel,
    specsLabel,
}: {
    href: string;
    priceLabel?: string;
    /** Custom price block. When set, `priceLabel` is ignored. */
    price?: ReactNode;
    /** Short “what” line — property type · Sqft. */
    headline: string;
    locationLabel: string;
    /** Optional quieter specs under the location. */
    specsLabel?: string;
}) {
    return (
        <div className="flex flex-col gap-2 min-inline-0">
            {price ?? (priceLabel ? <p className={PRICE_CLASS}>{priceLabel}</p> : null)}
            <div className="flex flex-col gap-1 min-inline-0">
                <h3 className="max-inline-full min-inline-0">
                    <PropertyTitleLink href={href} className={HEADLINE_CLASS}>
                        <MarqueeText text={headline} />
                    </PropertyTitleLink>
                </h3>
                <p className={META_LINE_CLASS}>
                    <MapPin
                        aria-hidden
                        className="shrink-0 block-3.5 inline-3.5"
                        strokeWidth={1.75}
                    />
                    <MarqueeText text={locationLabel} className="capitalize" />
                </p>
                {specsLabel ? (
                    <p className={META_LINE_CLASS}>
                        <Maximize2
                            aria-hidden
                            className="shrink-0 block-3.5 inline-3.5"
                            strokeWidth={1.75}
                        />
                        <MarqueeText text={specsLabel} />
                    </p>
                ) : null}
            </div>
        </div>
    );
}

/** Shared label column so Owner / Buyers / Broker lines align their faces. */
export const OVERLAY_PERSON_LABEL_CLASS = "shrink-0 text-ink-subtle inline-14";

/** Quiet person line under the summary (Owner / Broker). Avatar sits next to the name. */
export function OverlayPersonLine({
    label,
    name,
    hint,
    avatarUrl,
    action,
}: {
    label: string;
    name: string;
    hint?: ReactNode;
    avatarUrl?: string;
    /** Optional control after the name (e.g. Call). */
    action?: ReactNode;
}) {
    return (
        <div className={PERSON_CLASS}>
            <span className={OVERLAY_PERSON_LABEL_CLASS}>{label}</span>
            <span className="flex min-inline-0 items-center gap-1.5">
                <UserAvatar name={name} imageUrl={avatarUrl} size="2xs" className="shrink-0" />
                <span className="truncate font-semibold text-ink capitalize">{name}</span>
                {action}
            </span>
            {hint ? (
                <>
                    <span className="shrink-0 text-ink-subtle/60" aria-hidden>
                        ·
                    </span>
                    <span className="truncate text-ink-muted tabular-nums">{hint}</span>
                </>
            ) : null}
        </div>
    );
}

/** Pins CTAs to the bottom of a stretched card panel. */
export function OverlayCardActions({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div className={cn("pointer-events-auto mbs-auto flex gap-2 pbs-1", className)}>
            {children}
        </div>
    );
}

export type OverlayCardProps = {
    href: string;
    imageSrc?: string | null;
    /** Extra photos. More than one turns on the hover arrows. */
    images?: readonly string[];
    imageAlt: string;
    imageSizes: string;
    priority?: boolean;
    /** Desaturate the photo — closed deals, so live ones stand out while scanning. */
    muted?: boolean;
    /** Play one light pass across the card (new listings). */
    sweep?: boolean;
    /** Chips for the top-left of the photo. */
    chips: ReactNode;
    /** Icon buttons for the top-right of the photo (use OVERLAY_ICON_BUTTON_CLASS). */
    actions?: ReactNode;
    className?: string;
    /** Panel content, top to bottom. */
    children: ReactNode;
};

export function OverlayCard({
    href,
    imageSrc,
    images,
    imageAlt,
    imageSizes,
    priority = false,
    muted = false,
    sweep = false,
    chips,
    actions,
    className,
    children,
}: OverlayCardProps) {
    const photos = images && images.length > 0 ? images : imageSrc ? [imageSrc] : [];

    return (
        <article className={cn(CARD_CLASS, className)}>
            <div className={PHOTO_CLASS}>
                <OverlayCardPhotos
                    href={href}
                    images={photos}
                    imageAlt={imageAlt}
                    imageSizes={imageSizes}
                    priority={priority}
                    muted={muted}
                />

                {sweep ? <div aria-hidden className={SWEEP_CLASS} /> : null}

                <div
                    className={cn(
                        `
                          pointer-events-none absolute inset-s-3 inset-bs-3 z-10 flex flex-wrap
                          items-start gap-1.5
                        `,
                        actions ? "pe-14" : "pe-3",
                    )}
                >
                    {chips}
                </div>

                {actions ? (
                    <div className="absolute inset-e-3 inset-bs-3 z-20 flex flex-col gap-2">
                        {actions}
                    </div>
                ) : null}
            </div>

            <div className={PANEL_CLASS}>{children}</div>
        </article>
    );
}
