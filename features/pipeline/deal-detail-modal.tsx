"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

import useEmblaCarousel from "embla-carousel-react";
import { useReducedMotion } from "motion/react";

import { formatDateIn, formatDateShort, formatTimeIn } from "@/lib/format/date";
import { formatPrice, formatRent } from "@/lib/format/price";
import { brokerPropertyDetailHref } from "@/lib/routes/broker";

import { AppImage } from "@/components/shared/app-image";
import { AppModal } from "@/components/shared/app-modal";
import {
    type AppIcon,
    ArrowRight,
    BadgeCheck,
    Building2,
    CalendarCheck,
    CircleX,
    ExternalLink,
    HandCoins,
    Plus,
    Wallet,
} from "@/components/shared/icons";
import { PhoneNumber } from "@/components/shared/phone-number";
import { PriceWithCommission } from "@/components/shared/price-with-commission";
import { Skeleton } from "@/components/shared/skeleton";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { PipelineDetailSkeleton } from "@/features/pipeline/pipeline-skeleton";
import {
    DEAL_OUTCOME_META,
    DEAL_STAGE_META,
    lostReasonLabel,
} from "@/features/pipeline/stage-meta";
import type { DealDetail, DealHistoryEntry, DealStatus } from "@/features/pipeline/types";
import { isLiveStage, nextStage } from "@/features/pipeline/types";

import styles from "./deal-detail-modal.module.css";

const PropertyLightbox = dynamic(
    () => import("@/features/properties/property-detail/property-lightbox"),
    { ssr: false },
);

const API_STAGE_LABEL: Record<string, string> = {
    new: "New",
    contacted: "Contacted",
    site_visit: "Site visit",
    visit: "Site visit",
    negotiation: "Negotiation",
    offer_made: "Offer made",
    closed_won: "Closed won",
    closed: "Closed",
    closed_lost: "Closed lost",
    lost: "Lost",
    offer_rejected: "Offer rejected",
};

function stageLabel(status: string): string {
    return API_STAGE_LABEL[status] ?? status.replace(/_/g, " ");
}

function formatMoney(amountInr: number | null, isRent: boolean): string {
    if (amountInr == null || amountInr <= 0) return "Not added";
    return isRent ? formatRent(amountInr) : formatPrice(amountInr);
}

function formatWhen(iso: string | null): string {
    if (!iso) return "Date not added";
    const date = new Date(iso);
    if (!Number.isFinite(date.getTime())) return "Date unavailable";
    return `${formatDateIn(date)} at ${formatTimeIn(date)}`;
}

function historyIcon(status: string): AppIcon {
    if (status === "new") return Plus;
    if (status === "closed_won" || status === "closed") return BadgeCheck;
    if (status === "closed_lost" || status === "lost" || status === "offer_rejected")
        return CircleX;
    if (status === "site_visit" || status === "visit") return CalendarCheck;
    if (status === "offer_made" || status === "negotiation") return HandCoins;
    return ArrowRight;
}

function HistoryList({ history }: { history: DealHistoryEntry[] }) {
    const [expanded, setExpanded] = useState(false);
    if (!history.length)
        return <p className="body-sm text-ink-muted">Stage updates will appear here.</p>;
    const all = [...history].reverse();
    const ordered = expanded ? all : all.slice(0, 3);
    return (
        <>
            <ol className={styles.timeline} aria-label="Deal stage history, newest first">
                {ordered.map((entry, index) => {
                    const Icon = historyIcon(entry.status);
                    const date = entry.at ? new Date(entry.at) : null;
                    const validDate = date && Number.isFinite(date.getTime()) ? date : null;
                    return (
                        <li
                            key={`${entry.at}-${entry.status}-${index}`}
                            className={styles.timelineEntry}
                            data-latest={index === 0}
                        >
                            <span className={styles.timelineIcon} aria-hidden>
                                <Icon size={16} strokeWidth={1.7} />
                            </span>
                            <div className={styles.timelineContent}>
                                <div className={styles.timelineTitleRow}>
                                    <h3 className={styles.timelineTitle}>
                                        {stageLabel(entry.status)}
                                    </h3>
                                    {index === 0 ? (
                                        <Badge variant="brand" className="px-2 py-0.5 text-[10px]">
                                            Latest
                                        </Badge>
                                    ) : null}
                                </div>
                                {validDate ? (
                                    <time
                                        className={styles.timelineDate}
                                        dateTime={validDate.toISOString()}
                                        title={`${formatDateIn(validDate)}, ${formatTimeIn(validDate)}`}
                                    >
                                        {formatDateShort(validDate)} at {formatTimeIn(validDate)}
                                    </time>
                                ) : null}
                                {entry.note ? (
                                    <p className={styles.timelineNote}>{entry.note}</p>
                                ) : null}
                                {entry.by ? (
                                    <p className={styles.timelineActor}>
                                        Updated by <span>{entry.by}</span>
                                    </p>
                                ) : null}
                            </div>
                        </li>
                    );
                })}
            </ol>
            {all.length > 3 ? (
                <button
                    type="button"
                    className={styles.textAction}
                    aria-expanded={expanded}
                    onClick={() => setExpanded((value) => !value)}
                >
                    {expanded ? "Show latest 3 updates" : `View all ${all.length} updates`}
                </button>
            ) : null}
        </>
    );
}

function DealPhotos({
    property,
    onLightboxChange,
}: {
    property: DealDetail["property"];
    onLightboxChange: (open: boolean) => void;
}) {
    const photos = [
        ...new Set(
            (property.imageSrcs?.length ? property.imageSrcs : [property.imageSrc]).filter(Boolean),
        ),
    ];
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [failed, setFailed] = useState<string[]>([]);
    const [loaded, setLoaded] = useState<string[]>([]);
    const [active, setActive] = useState(0);
    const reduceMotion = useReducedMotion();
    const [viewportRef, carousel] = useEmblaCarousel({
        loop: photos.length > 1,
        duration: reduceMotion ? 0 : 28,
    });
    const thumbnailsRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!carousel) return;
        const select = () => {
            const selected = carousel.selectedScrollSnap();
            setActive(selected);
            const thumbnail = thumbnailsRef.current?.children[selected] as HTMLElement | undefined;
            const strip = thumbnailsRef.current;
            if (thumbnail && strip) {
                // Scroll only the thumbnail strip, never the surrounding modal.
                strip.scrollTo({
                    left:
                        thumbnail.offsetLeft -
                        strip.offsetLeft -
                        (strip.clientWidth - thumbnail.clientWidth) / 2,
                    behavior: reduceMotion ? "instant" : "smooth",
                });
            }
        };
        let frame = 0;
        const layers = carousel
            .slideNodes()
            .map((slide) => slide.querySelector<HTMLElement>("[data-deal-parallax]"));
        const update = () => {
            frame = 0;
            if (reduceMotion) {
                layers.forEach((layer) => {
                    if (layer) layer.style.transform = "";
                });
                return;
            }
            const viewport = carousel.rootNode().getBoundingClientRect();
            const center = viewport.left + viewport.width / 2;
            const rects = carousel.slideNodes().map((slide) => slide.getBoundingClientRect());
            rects.forEach((rect, index) => {
                const layer = layers[index];
                if (!layer) return;
                const offset = Math.max(
                    -rect.width * 0.07,
                    Math.min(rect.width * 0.07, (center - rect.left - rect.width / 2) * 0.18),
                );
                layer.style.transform = `translate3d(${offset}px, 0, 0)`;
            });
        };
        const schedule = () => {
            if (!frame) frame = requestAnimationFrame(update);
        };
        select();
        schedule();
        carousel
            .on("select", select)
            .on("reInit", select)
            .on("scroll", schedule)
            .on("reInit", schedule);
        return () => {
            cancelAnimationFrame(frame);
            carousel
                .off("select", select)
                .off("reInit", select)
                .off("scroll", schedule)
                .off("reInit", schedule);
            layers.forEach((layer) => {
                if (layer) layer.style.transform = "";
            });
        };
    }, [carousel, reduceMotion]);
    return (
        <div className={styles.gallery}>
            {photos.length ? (
                <>
                    <div
                        className={styles.carouselFrame}
                        role="region"
                        aria-roledescription="carousel"
                        aria-label="Property photos"
                        onKeyDown={(event) => {
                            if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                                event.preventDefault();
                                if (event.key === "ArrowLeft") carousel?.scrollPrev();
                                else carousel?.scrollNext();
                            }
                        }}
                    >
                        <div ref={viewportRef} className={styles.carouselViewport}>
                            <div className={styles.carouselTrack}>
                                {photos.map((src, index) => (
                                    <button
                                        key={src}
                                        type="button"
                                        className={styles.carouselSlide}
                                        tabIndex={index === active ? 0 : -1}
                                        onClick={() => {
                                            setActive(index);
                                            setLightboxOpen(true);
                                            onLightboxChange(true);
                                        }}
                                        aria-label={`Open property photo ${index + 1} of ${photos.length}`}
                                        aria-hidden={index !== active}
                                    >
                                        {!failed.includes(src) ? (
                                            <span
                                                className={styles.parallaxImage}
                                                data-deal-parallax
                                            >
                                                <AppImage
                                                    src={src}
                                                    alt={`${property.title} - photo ${index + 1}`}
                                                    fill
                                                    draggable={false}
                                                    sizes="(max-width: 899px) 90vw, 560px"
                                                    priority={index === 0}
                                                    onLoad={() =>
                                                        setLoaded((previous) =>
                                                            previous.includes(src)
                                                                ? previous
                                                                : [...previous, src],
                                                        )
                                                    }
                                                    onError={() =>
                                                        setFailed((previous) => [...previous, src])
                                                    }
                                                />
                                                {!loaded.includes(src) ? (
                                                    <Skeleton className={styles.imageSkeleton} />
                                                ) : null}
                                            </span>
                                        ) : (
                                            <span className={styles.photoEmpty}>
                                                <Building2 size={32} strokeWidth={1.5} />
                                                <span>Photo could not load</span>
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {photos.length > 1 ? (
                            <>
                                <span
                                    className={styles.photoPosition}
                                    aria-live="polite"
                                    aria-atomic="true"
                                >
                                    {active + 1} / {photos.length}
                                </span>
                            </>
                        ) : null}
                    </div>
                    {photos.length > 1 ? (
                        <div
                            ref={thumbnailsRef}
                            className={styles.thumbnails}
                            role="group"
                            aria-label="Choose property photo"
                        >
                            {photos.map((src, index) => (
                                <button
                                    type="button"
                                    key={src}
                                    className={styles.thumbnail}
                                    aria-label={`Show property photo ${index + 1}`}
                                    aria-pressed={active === index}
                                    onClick={() => carousel?.scrollTo(index)}
                                >
                                    <AppImage src={src} alt="" fill sizes="64px" />
                                </button>
                            ))}
                        </div>
                    ) : null}
                </>
            ) : (
                <div className={styles.emptyGallery}>
                    <Building2 size={32} strokeWidth={1.5} />
                    <span>No property photos added</span>
                </div>
            )}
            {lightboxOpen ? (
                <PropertyLightbox
                    title={property.title}
                    imageSrcs={photos}
                    index={active}
                    onClose={() => {
                        setLightboxOpen(false);
                        onLightboxChange(false);
                    }}
                />
            ) : null}
        </div>
    );
}

function DealNotes({ note }: { note: string }) {
    const [expanded, setExpanded] = useState(false);
    const long = note.length > 220;
    return (
        <div className={styles.notes}>
            <h2 className="body-sm flex items-center gap-1.5 font-semibold">Notes</h2>
            <p className={styles.noteBody}>
                {long && !expanded ? `${note.slice(0, 220).trimEnd()}...` : note}
            </p>
            {long ? (
                <button
                    type="button"
                    className={styles.textAction}
                    aria-expanded={expanded}
                    onClick={() => setExpanded((value) => !value)}
                >
                    {expanded ? "Show less" : "Read full note"}
                </button>
            ) : null}
        </div>
    );
}

function DetailField({
    label,
    children,
    icon: Icon,
}: {
    label: string;
    children: ReactNode;
    icon?: AppIcon;
}) {
    return (
        <div className={styles.dealFact}>
            {Icon ? (
                <Icon className={styles.dealFactIcon} size={20} strokeWidth={1.6} aria-hidden />
            ) : null}
            <div className={styles.dealFactContent}>
                <p className="body-xs text-ink-muted">{label}</p>
                <div className="body-sm font-medium text-ink">{children}</div>
            </div>
        </div>
    );
}

/**
 * Full lead sheet: parties, money, notes, and stage history.
 * Opened from the View button on a pipeline card.
 */
export function DealDetailModal({
    open,
    deal: detail,
    isLoading,
    error,
    onClose,
    onStageAction,
    onRetry,
    isBusy,
}: {
    open: boolean;
    deal: DealDetail | null;
    isLoading: boolean;
    error: string | null;
    onClose: () => void;
    onStageAction: (status: DealStatus) => void;
    onRetry: () => void;
    isBusy: boolean;
}) {
    const deal = detail;
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const next = deal && isLiveStage(deal.status) ? nextStage(deal.status) : null;
    const target: DealStatus | null = next ?? (deal?.status === "negotiation" ? "closed" : null);
    const actionLabel =
        target === "contacted"
            ? "Mark contacted"
            : target === "visit"
              ? "Move to site visit"
              : target === "negotiation"
                ? "Start negotiating"
                : "Mark as closed";
    const ActionIcon = target && isLiveStage(target) ? DEAL_STAGE_META[target].icon : BadgeCheck;
    const title = deal ? deal.buyer.name : "Deal details";

    const statusLabel = deal
        ? detail?.apiStage
            ? stageLabel(detail.apiStage)
            : isLiveStage(deal.status)
              ? DEAL_STAGE_META[deal.status].label
              : DEAL_OUTCOME_META[deal.status].label
        : null;

    return (
        <AppModal
            open={open}
            modal={!lightboxOpen}
            onOpenChange={(next) => {
                if (!next && !lightboxOpen) onClose();
            }}
            size="xl"
            nativeScroll
            footer={
                isLoading ? (
                    <div className={styles.footer} aria-hidden>
                        <Skeleton className="block-11 inline-36" />
                        <Skeleton className="block-11 inline-44" />
                    </div>
                ) : deal ? (
                    <div className={styles.footer}>
                        <Button
                            variant="link"
                            nativeButton={false}
                            render={<Link href={brokerPropertyDetailHref(deal.property.id)} />}
                        >
                            View full property <ExternalLink size={16} aria-hidden />
                        </Button>
                        {target ? (
                            <Button
                                variant="accent"
                                disabled={isBusy || isLoading}
                                onClick={() => onStageAction(target)}
                            >
                                <ActionIcon size={18} aria-hidden />
                                {isBusy ? "Please wait..." : actionLabel}
                            </Button>
                        ) : null}
                    </div>
                ) : undefined
            }
            className={styles.modal}
            bodyClassName={styles.body}
            headerClassName={styles.header}
            footerClassName={styles.footerBar}
            title={
                <span className="flex flex-wrap items-center gap-2">
                    {isLoading ? (
                        <>
                            <span className="sr-only">Deal details</span>
                            <Skeleton className="block-6 inline-32" />
                            <Skeleton className="rounded-full block-6 inline-24" />
                        </>
                    ) : (
                        title
                    )}
                    {!isLoading && statusLabel ? (
                        <Badge variant="brand">{statusLabel}</Badge>
                    ) : null}
                </span>
            }
            description={
                isLoading ? (
                    <Skeleton className="block-5 inline-28" />
                ) : deal ? (
                    `${deal.property.locality}, ${deal.property.city}`
                ) : (
                    "Client, property, offer and stage history."
                )
            }
        >
            {isLoading ? (
                <PipelineDetailSkeleton />
            ) : error && !deal ? (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                    <p role="alert" className="body-sm text-urgent">
                        Could not load deal details.
                    </p>
                    <p className="body-sm text-ink-muted">
                        Try again. If the problem continues, close this window and reopen the deal.
                    </p>
                    <Button variant="outline" onClick={onRetry}>
                        Try again
                    </Button>
                </div>
            ) : deal ? (
                <div className={styles.layout}>
                    {error ? (
                        <p role="alert" className="body-xs text-urgent">
                            {error}
                        </p>
                    ) : null}

                    <div className={styles.leftColumn}>
                        <DealPhotos
                            onLightboxChange={setLightboxOpen}
                            key={deal.id}
                            property={deal.property}
                        />

                        <div className={styles.property}>
                            <div className={styles.propertySummary}>
                                <h2 className="font-display text-xl font-semibold text-ink">
                                    {deal.property.title}
                                </h2>
                                <p className="body-sm text-ink-muted">
                                    {deal.property.isRent
                                        ? "Available for rent"
                                        : "Available for sale"}{" "}
                                    {" / "}
                                    {[deal.property.locality, deal.property.city]
                                        .filter(
                                            (value, index, values) =>
                                                value && values.indexOf(value) === index,
                                        )
                                        .join(", ")}
                                </p>
                                <PriceWithCommission
                                    amountInr={deal.property.amountInr}
                                    isRent={deal.property.isRent}
                                    commissionPercent={deal.property.commissionPercent}
                                    commissionAmountInr={deal.property.commissionAmountInr}
                                    audience="broker"
                                    size="lg"
                                />
                            </div>
                        </div>
                        <div className={styles.details}>
                            <h2 className={styles.sectionTitle}>Client & owner</h2>
                            <div className={styles.contacts}>
                                <div className="flex items-center gap-2.5 min-inline-0">
                                    <UserAvatar
                                        name={deal.buyer.name}
                                        imageUrl={deal.buyer.avatarUrl}
                                    />
                                    <div className="min-inline-0">
                                        <p className="body-xs text-ink-muted">Client</p>
                                        <p className="body-sm font-medium wrap-anywhere text-ink">
                                            {deal.buyer.name}
                                        </p>
                                        {deal.buyer.phoneDigits ? (
                                            <PhoneNumber
                                                phoneDigits={deal.buyer.phoneDigits}
                                                className="body-xs whitespace-nowrap text-ink-muted"
                                            />
                                        ) : (
                                            <p className="body-xs text-ink-muted">
                                                Phone number not added
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2.5 min-inline-0">
                                    <UserAvatar
                                        name={deal.owner.name}
                                        imageUrl={deal.owner.avatarUrl}
                                    />
                                    <div className="min-inline-0">
                                        <p className="body-xs text-ink-muted">Owner</p>
                                        <p className="body-sm font-medium wrap-anywhere text-ink">
                                            {deal.owner.name}
                                        </p>
                                        {deal.owner.isRepresentationActive &&
                                        deal.owner.phoneDigits ? (
                                            <PhoneNumber
                                                phoneDigits={deal.owner.phoneDigits}
                                                className="body-xs whitespace-nowrap text-ink-muted"
                                            />
                                        ) : (
                                            <p className="body-xs text-ink-subtle">
                                                {deal.owner.isRepresentationActive
                                                    ? "Phone number not added"
                                                    : "Phone number not shared"}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {deal.offerAmountInr != null ||
                            deal.buyer.budgetMaxInr != null ||
                            (deal.status === "closed" && deal.closedAmountInr != null) ||
                            (deal.status === "lost" && deal.lostReason) ? (
                                <>
                                    <h2 className={styles.sectionTitle}>Deal summary</h2>
                                    <div className={styles.facts}>
                                        {deal.buyer.budgetMaxInr != null ? (
                                            <DetailField label="Client budget" icon={Wallet}>
                                                {formatMoney(
                                                    deal.buyer.budgetMaxInr,
                                                    deal.property.isRent,
                                                )}
                                            </DetailField>
                                        ) : null}
                                        {deal.offerAmountInr != null ? (
                                            <DetailField label="Latest offer" icon={HandCoins}>
                                                <span>
                                                    {formatMoney(
                                                        deal.offerAmountInr,
                                                        deal.property.isRent,
                                                    )}
                                                </span>
                                                {deal.offerStatus ? (
                                                    <Badge
                                                        variant="neutral"
                                                        className="ms-2 capitalize"
                                                    >
                                                        {deal.offerStatus}
                                                    </Badge>
                                                ) : null}
                                            </DetailField>
                                        ) : null}
                                        {deal.status === "closed" &&
                                        deal.closedAmountInr != null ? (
                                            <DetailField label="Final amount" icon={BadgeCheck}>
                                                {formatMoney(
                                                    deal.closedAmountInr,
                                                    deal.property.isRent,
                                                )}
                                            </DetailField>
                                        ) : null}
                                        {deal.status === "lost" && deal.lostReason ? (
                                            <DetailField label="Reason lost" icon={CircleX}>
                                                {lostReasonLabel(deal.lostReason)}
                                            </DetailField>
                                        ) : null}
                                    </div>
                                </>
                            ) : null}

                            {deal.nextVisitAt ? (
                                <DetailField label="Next visit" icon={CalendarCheck}>
                                    {formatWhen(deal.nextVisitAt)}
                                </DetailField>
                            ) : null}
                        </div>
                    </div>
                    <div className={styles.rightColumn}>
                        {deal.note ? <DealNotes key={deal.id} note={deal.note} /> : null}

                        <div className={styles.history}>
                            <h2 className={styles.sectionTitle}>Stage history</h2>
                            <HistoryList key={deal.id} history={deal.history} />
                        </div>
                    </div>
                </div>
            ) : null}
        </AppModal>
    );
}
