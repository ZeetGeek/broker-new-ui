"use client";

import type { ReactNode } from "react";
import Link from "next/link";

import { Building2, MapPin, Maximize2 } from "lucide-react";

import { cn } from "@/lib/utils";

import { AppImage } from "@/components/shared/app-image";
import { HoverScaleLayer, HoverScaleRoot } from "@/components/shared/hover-scale-media";
import { PropertyTitleLink } from "@/components/shared/property-title-link";

/*
 * Overlay property card: the cover photo fills the whole card and the details
 * sit on a blurred panel over its lower part. The clear photo band is
 * `aspect-5/4` of the card width and grows when a taller card in the same grid
 * row stretches this one. The panel starts 3.5rem above the band and fades in.
 *
 * `transform-gpu` gives the card its own layer: without it Chrome lets the
 * backdrop-blur panel paint past `overflow-hidden` and the corners go square.
 */
const CARD_CLASS = `
  relative isolate flex flex-1 transform-gpu flex-col overflow-hidden rounded-card bg-brand-ink
  shadow-md transition-[box-shadow,translate] duration-160
  hover:-translate-y-0.5 hover:shadow-lg
`;
// One light pass across the card when it appears (new listings).
const SWEEP_CLASS = `
  pointer-events-none absolute inset-y-0 inset-s-[-40%] inline-[40%]
  bg-linear-to-r from-transparent via-surface/35 to-transparent
  motion-safe:animate-card-sweep
`;
const PHOTO_BAND_CLASS = "pointer-events-none aspect-5/4 shrink-0 grow inline-full";
// Panel ignores the pointer so taps on its text open the listing underneath;
// links and buttons inside it opt back in.
const PANEL_CLASS = `
  pointer-events-none relative z-10 -mbs-14 flex flex-col gap-3 px-4 pbs-14 pbe-4 text-surface
  [&_a]:pointer-events-auto [&_button]:pointer-events-auto
`;
const PANEL_BLUR_CLASS = `
  absolute inset-0 -z-10 rounded-b-card backdrop-blur-xl
  [mask-image:linear-gradient(to_bottom,transparent,black_3.5rem)]
`;
const PANEL_SCRIM_CLASS = `
  absolute inset-0 -z-10 rounded-b-card
  bg-[linear-gradient(to_bottom,transparent,color-mix(in_oklab,var(--color-brand-ink)_40%,transparent)_3.5rem,color-mix(in_oklab,var(--color-brand-ink)_80%,transparent))]
`;
const TITLE_CLASS = "body truncate font-semibold tracking-wide text-surface capitalize hover:text-surface";
const META_LINE_CLASS =
    "body-sm flex items-center gap-1.5 tracking-wide text-surface/75 min-inline-0";

/** Round glass icon button for the top-right corner of the photo. 48px hit area. */
export const OVERLAY_ICON_BUTTON_CLASS = `
  pointer-events-auto relative rounded-full bg-ink/30 text-surface backdrop-blur-md block-10
  inline-10
  after:absolute after:-inset-1
  hover:bg-ink/45 hover:text-surface
  aria-expanded:bg-ink/45 aria-expanded:text-surface
`;

/** Secondary text button on the dark panel (the primary stays `accent`). */
export const OVERLAY_GLASS_BUTTON_CLASS = `
  border border-surface/35 bg-surface/10 font-semibold text-surface
  hover:border-surface/50 hover:bg-surface/20 hover:text-surface
`;

/** Glass chip for the photo — status, sale/rent, new. */
export function OverlayChip({
    dotClassName,
    pulse = false,
    children,
}: {
    dotClassName: string;
    /** Ping the dot. Use only for something that is genuinely fresh or waiting on the user. */
    pulse?: boolean;
    children: ReactNode;
}) {
    return (
        <span
            className="
              body-xs inline-flex items-center gap-1.5 rounded-full bg-ink/30 px-2.5 py-1
              font-semibold tracking-wide whitespace-nowrap text-surface backdrop-blur-md
            "
        >
            <span aria-hidden className="relative flex shrink-0 block-1.5 inline-1.5">
                {pulse ? (
                    <span
                        className={cn(
                            "absolute inset-0 rounded-full motion-safe:animate-ping",
                            dotClassName,
                        )}
                    />
                ) : null}
                <span className={cn("relative rounded-full block-1.5 inline-1.5", dotClassName)} />
            </span>
            {children}
        </span>
    );
}

/** Divided row of small label/value pairs under the summary. */
export function OverlayStatsRow({ children }: { children: ReactNode }) {
    return (
        <div
            className="
              grid auto-cols-fr grid-flow-col divide-x divide-surface/20 border-bs border-surface/20
              pbs-3
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
            <span className="body-xs truncate tracking-wide text-surface/70">{label}</span>
            <span className="body-sm truncate font-semibold tracking-wide tabular-nums">
                {children}
            </span>
            {hint ? (
                <span className="body-xs truncate tracking-wide text-surface/75 tabular-nums">
                    {hint}
                </span>
            ) : null}
        </div>
    );
}

/** Title + price, location, and specs — the top of every overlay panel. */
export function OverlayCardSummary({
    href,
    title,
    priceLabel,
    locationLabel,
    specsLabel,
}: {
    href: string;
    title: string;
    priceLabel: string;
    locationLabel: string;
    specsLabel: string;
}) {
    return (
        <div className="flex flex-col gap-1 min-inline-0">
            <div className="flex items-baseline justify-between gap-3 min-inline-0">
                <h3 className="max-inline-full min-inline-0">
                    <PropertyTitleLink href={href} className={TITLE_CLASS}>
                        {title}
                    </PropertyTitleLink>
                </h3>
                <span className="h5 shrink-0 font-semibold tracking-wide tabular-nums">
                    {priceLabel}
                </span>
            </div>
            <p className={META_LINE_CLASS}>
                <MapPin aria-hidden className="shrink-0 block-3.5 inline-3.5" strokeWidth={1.75} />
                <span className="truncate capitalize">{locationLabel}</span>
            </p>
            <p className={META_LINE_CLASS}>
                <Maximize2 aria-hidden className="shrink-0 block-3.5 inline-3.5" strokeWidth={1.75} />
                <span className="truncate">{specsLabel}</span>
            </p>
        </div>
    );
}

export type OverlayCardProps = {
    href: string;
    imageSrc?: string | null;
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
    return (
        <article className={cn(CARD_CLASS, className)}>
            {/* Duplicate of the title link for pointer users; hidden from keyboard and AT. */}
            <Link
                href={href}
                prefetch={false}
                tabIndex={-1}
                aria-hidden
                className="absolute inset-0"
            >
                <HoverScaleRoot className="relative overflow-hidden block-full inline-full">
                    {imageSrc ? (
                        <HoverScaleLayer className="absolute inset-0">
                            <AppImage
                                src={imageSrc}
                                alt={imageAlt}
                                fill
                                sizes={imageSizes}
                                priority={priority}
                                className={cn("object-cover", muted && "grayscale-60")}
                            />
                        </HoverScaleLayer>
                    ) : (
                        <div
                            className="
                              flex aspect-5/4 flex-col items-center justify-center gap-2 px-4
                              text-center inline-full
                            "
                        >
                            <Building2
                                aria-hidden
                                className="text-surface/50 block-8 inline-8"
                                strokeWidth={1.5}
                            />
                            <p className="body-xs text-surface/60">No photos yet</p>
                        </div>
                    )}
                </HoverScaleRoot>
            </Link>

            {sweep ? <div aria-hidden className={SWEEP_CLASS} /> : null}

            <div
                className={cn(
                    `
                      pointer-events-none absolute inset-s-3 inset-bs-3 z-10 flex flex-wrap
                      items-start gap-1.5
                    `,
                    actions ? "pe-16" : "pe-3",
                )}
            >
                {chips}
            </div>

            {actions ? (
                <div className="absolute inset-e-3 inset-bs-3 z-20 flex flex-col gap-2">
                    {actions}
                </div>
            ) : null}

            <div aria-hidden className={PHOTO_BAND_CLASS} />

            <div className={PANEL_CLASS}>
                <div aria-hidden className={PANEL_BLUR_CLASS} />
                <div aria-hidden className={PANEL_SCRIM_CLASS} />
                {children}
            </div>
        </article>
    );
}
