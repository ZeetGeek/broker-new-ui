"use client";

import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

import { addCollection, Icon } from "@iconify/react/offline";
import {
    BedDouble,
    Building2,
    CalendarClock,
    ChevronLeft,
    ChevronRight,
    Download,
    ExternalLink,
    FileText,
    Home,
    IndianRupee,
    Link2,
    Lock,
    Mail,
    MapPin,
    Phone,
    Plus,
    StickyNote,
    Tag,
    Trash2,
    X,
    type LucideIcon,
} from "lucide-react";

import { formatDateShort, formatRelativePast } from "@/lib/format/date";
import { formatPhoneIn, formatWhatsAppUrl } from "@/lib/format/phone";
import { formatIndianPrice } from "@/lib/format/price";
import { brokerPropertyDetailHref, BROKER_YOUR_LISTINGS_HREF } from "@/lib/routes/broker";
import { cn } from "@/lib/utils";

import { AppImage } from "@/components/shared/app-image";
import { AppModal } from "@/components/shared/app-modal";
import { PropertyThumb } from "@/components/shared/property-thumb";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { SOURCE_OPTIONS } from "@/features/contacts/buyer-options";
import {
    toBuyerContactCardModel,
    toOwnerContactCardModel,
    type ContactPropertyCardItem,
} from "@/features/contacts/contact-card-model";
import type { BuyerContactForm, OwnerContactForm } from "@/features/contacts/contact-form-model";
import type { BuyerRow, OwnerRow } from "@/features/contacts/types";
import whatsappIcons from "@/features/properties/my-requests/bi-whatsapp.json";

addCollection(whatsappIcons as Parameters<typeof addCollection>[0]);

type DetailEntry = {
    label: string;
    value?: ReactNode;
    empty?: boolean;
    wide?: boolean;
};

type IconFact = {
    label: string;
    value?: ReactNode;
    empty?: boolean;
    wide?: boolean;
    icon: LucideIcon;
};

function IconFactGrid({ facts, onAdd }: { facts: IconFact[]; onAdd?: () => void }) {
    const filled = facts.filter((fact) => hasValue(fact.value, fact.empty));
    if (!filled.length) {
        return onAdd ? (
            <button
                type="button"
                onClick={onAdd}
                className="body-sm flex items-center gap-2 font-semibold text-brand-text hover:underline"
            >
                <Plus aria-hidden className="block-4 inline-4" /> Add details
            </button>
        ) : (
            <p className="body-sm text-ink-subtle">No details yet</p>
        );
    }

    // Open field grid (Add buyer style) — no nested cell borders, so no double lines.
    return (
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            {filled.map((fact, index) => {
                const IconGlyph = fact.icon;
                const aloneOnLastRow =
                    !fact.wide && filled.length % 2 === 1 && index === filled.length - 1;
                return (
                    <div
                        key={fact.label}
                        className={cn(
                            "flex items-start gap-3 min-inline-0",
                            (fact.wide || aloneOnLastRow) && "sm:col-span-2",
                        )}
                    >
                        <IconGlyph
                            aria-hidden
                            className="mbs-1 shrink-0 text-ink-muted block-5 inline-5"
                            strokeWidth={1.75}
                        />
                        <div className="min-inline-0 flex-1">
                            <dt className="body-sm text-ink-muted">{fact.label}</dt>
                            <dd className="body mbs-0.5 break-words font-semibold text-ink">
                                {fact.value}
                            </dd>
                        </div>
                    </div>
                );
            })}
        </dl>
    );
}

function hasValue(value: ReactNode, explicitEmpty?: boolean): boolean {
    if (explicitEmpty != null) return !explicitEmpty;
    if (value == null || value === "") return false;
    if (Array.isArray(value)) return value.length > 0;
    return true;
}

function ValueChips({ values }: { values?: string[] }) {
    if (!values?.length) return null;
    return (
        <span className="flex flex-wrap gap-1.5">
            {values.map((value) => (
                <Badge key={value} variant="outline" className="font-medium text-ink">
                    {value}
                </Badge>
            ))}
        </span>
    );
}

function DetailSection({
    title,
    entries,
    locked = false,
    onAdd,
    children,
    sectionRef,
}: {
    title: string;
    entries?: DetailEntry[];
    locked?: boolean;
    onAdd?: () => void;
    children?: ReactNode;
    sectionRef?: React.RefObject<HTMLElement | null>;
}) {
    const [showEmpty, setShowEmpty] = useState(false);
    const list = entries ?? [];
    const filled = list.filter((entry) => hasValue(entry.value, entry.empty));
    const empty = list.filter((entry) => !hasValue(entry.value, entry.empty));
    const hasCustomContent = children != null;

    return (
        <section ref={sectionRef} className="scroll-mt-5 pbe-6">
            <div className="mbe-4 flex items-center gap-2">
                <h3 className="body font-bold text-ink">{title}</h3>
                {locked ? (
                    <span
                        className="flex items-center gap-1 text-[11px] text-ink-subtle"
                        title="Owner details come from the platform"
                    >
                        <Lock aria-hidden className="block-3 inline-3" /> Platform managed
                    </span>
                ) : null}
            </div>

            {children}
            {!hasCustomContent && (filled.length || showEmpty) ? (
                <dl className="grid grid-cols-2 gap-x-5 gap-y-3">
                    {[...filled, ...(showEmpty ? empty : [])].map((entry) => {
                        const present = hasValue(entry.value, entry.empty);
                        return (
                            <div
                                key={entry.label}
                                className={cn("min-inline-0", entry.wide && "col-span-2")}
                            >
                                <dt className="text-[11px] font-medium text-ink-subtle">
                                    {entry.label}
                                </dt>
                                <dd className="body-xs mbs-1 break-words font-medium text-ink">
                                    {present ? (
                                        entry.value
                                    ) : locked ? (
                                        <span className="font-normal text-ink-subtle">
                                            Not provided
                                        </span>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={onAdd}
                                            className="inline-flex items-center gap-1 font-semibold text-brand-text hover:underline"
                                        >
                                            <Plus aria-hidden className="block-3 inline-3" /> Add
                                        </button>
                                    )}
                                </dd>
                            </div>
                        );
                    })}
                </dl>
            ) : !hasCustomContent && onAdd && !locked ? (
                <button
                    type="button"
                    onClick={onAdd}
                    className="body-xs flex items-center gap-2 font-semibold text-brand-text hover:underline"
                >
                    <Plus aria-hidden className="block-3.5 inline-3.5" /> Add {title.toLowerCase()}
                </button>
            ) : !hasCustomContent ? (
                <p className="body-xs text-ink-subtle">No {title.toLowerCase()} details</p>
            ) : null}

            {!hasCustomContent && empty.length > 0 && (filled.length > 0 || showEmpty) ? (
                <button
                    type="button"
                    onClick={() => setShowEmpty((value) => !value)}
                    className="body-xs mbs-3 font-semibold text-ink-muted hover:text-ink"
                >
                    {showEmpty ? "Hide empty fields" : "Show empty fields"}
                </button>
            ) : null}
        </section>
    );
}

function AttachedPropertyRows({
    properties,
    onAttach,
    onDetach,
    detachingLeadId,
}: {
    properties: ContactPropertyCardItem[];
    onAttach?: () => void;
    onDetach?: (property: ContactPropertyCardItem) => void;
    detachingLeadId?: string | null;
}) {
    const attachLabel = properties.length > 0 ? "Attach more property" : "Attach property";

    return (
        <div className="flex flex-col gap-2.5">
            {properties.map((property) => {
                const canDetach = Boolean(onDetach && property.leadId);
                const busy = detachingLeadId === property.leadId;
                return (
                    <div
                        key={property.leadId || property.id}
                        className="group/property flex items-center gap-2 rounded-inner border border-border-warm bg-surface p-2.5 shadow-xs hover:border-brand/35"
                    >
                        <Link
                            href={brokerPropertyDetailHref(property.id)}
                            className="flex flex-1 items-center gap-3 min-inline-0"
                        >
                            <PropertyThumb
                                src={property.coverUrl}
                                alt=""
                                hoverScale={false}
                                sizes="72px"
                                iconClassName="block-6 inline-6"
                                sizeClassName="block-18 inline-18"
                            />
                            <span className="flex-1 min-inline-0">
                                <span className="body-sm block truncate font-semibold text-ink">
                                    {property.title}
                                </span>
                                <span className="body-xs text-ink-muted">{property.locality}</span>
                                <span className="tabular body-sm mbs-0.5 block font-semibold text-brand">
                                    {property.priceLabel}
                                </span>
                            </span>
                        </Link>
                        {canDetach ? (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                disabled={busy || Boolean(detachingLeadId)}
                                loading={busy}
                                aria-label={`Remove ${property.title}`}
                                className="text-danger hover:bg-danger-soft hover:text-danger"
                                onClick={() => onDetach?.(property)}
                            >
                                <Trash2 aria-hidden className="block-4 inline-4" />
                            </Button>
                        ) : null}
                    </div>
                );
            })}
            {onAttach ? (
                <button
                    type="button"
                    onClick={onAttach}
                    className="body-sm flex items-center justify-center gap-2 rounded-inner border border-dashed border-brand/40 px-3 py-3.5 font-semibold text-brand-text hover:bg-brand-soft/50"
                >
                    <Link2 aria-hidden className="block-4 inline-4" />
                    {attachLabel}
                </button>
            ) : null}
        </div>
    );
}

function useFileUrls(files: File[] | undefined) {
    const urls = useMemo(() => files?.map((file) => URL.createObjectURL(file)) ?? [], [files]);
    useEffect(() => {
        return () => urls.forEach((url) => URL.revokeObjectURL(url));
    }, [urls]);
    return urls;
}

function ContactPhotoGallery({ title, photos }: { title: string; photos: string[] }) {
    const [active, setActive] = useState(0);
    const [lightbox, setLightbox] = useState(false);
    const step = useCallback(
        (delta: number) => setActive((index) => (index + delta + photos.length) % photos.length),
        [photos.length],
    );

    useEffect(() => {
        if (!lightbox) return;
        const listener = (event: KeyboardEvent) => {
            if (event.key === "Escape") setLightbox(false);
            if (event.key === "ArrowLeft") step(-1);
            if (event.key === "ArrowRight") step(1);
        };
        document.addEventListener("keydown", listener);
        return () => document.removeEventListener("keydown", listener);
    }, [lightbox, step]);

    if (!photos.length) return null;
    return (
        <section className="border-be border-border-warm pbe-5">
            <button
                type="button"
                onClick={() => setLightbox(true)}
                className="relative aspect-video overflow-hidden rounded-inner bg-surface-muted outline-none inline-full focus-visible:ring-3 focus-visible:ring-brand/30"
            >
                <AppImage
                    src={photos[active]!}
                    alt={`${title} property photo ${active + 1}`}
                    fill
                    sizes="(max-width: 640px) 100vw, 640px"
                />
            </button>
            {photos.length > 1 ? (
                <div className="mbs-2 flex gap-2 overflow-x-auto p-0.5">
                    {photos.map((photo, index) => (
                        <button
                            key={photo}
                            type="button"
                            onClick={() => setActive(index)}
                            aria-label={`Show photo ${index + 1}`}
                            className={cn(
                                "relative shrink-0 overflow-hidden rounded-md border-2 block-12 inline-16",
                                active === index ? "border-brand" : "border-transparent",
                            )}
                        >
                            <AppImage src={photo} alt="" fill sizes="64px" quality={70} />
                        </button>
                    ))}
                </div>
            ) : null}
            {lightbox ? (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label={`${title} photos`}
                    onClick={() => setLightbox(false)}
                    className="fixed inset-0 z-60 flex items-center justify-center bg-brand-ink/95 p-4"
                >
                    <button
                        type="button"
                        aria-label="Close photos"
                        onClick={() => setLightbox(false)}
                        className="absolute inset-e-4 inset-bs-4 rounded-control p-2 text-surface hover:bg-surface/15"
                    >
                        <X aria-hidden />
                    </button>
                    {photos.length > 1 ? (
                        <button
                            type="button"
                            aria-label="Previous photo"
                            onClick={(event) => {
                                event.stopPropagation();
                                step(-1);
                            }}
                            className="absolute inset-s-4 rounded-control p-2 text-surface hover:bg-surface/15"
                        >
                            <ChevronLeft aria-hidden />
                        </button>
                    ) : null}
                    <div
                        className="relative block-[85vh] inline-[min(92vw,72rem)]"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <AppImage
                            src={photos[active]!}
                            alt={`${title} property photo ${active + 1}`}
                            fill
                            sizes="92vw"
                            className="object-contain"
                        />
                    </div>
                    {photos.length > 1 ? (
                        <button
                            type="button"
                            aria-label="Next photo"
                            onClick={(event) => {
                                event.stopPropagation();
                                step(1);
                            }}
                            className="absolute inset-e-4 rounded-control p-2 text-surface hover:bg-surface/15"
                        >
                            <ChevronRight aria-hidden />
                        </button>
                    ) : null}
                </div>
            ) : null}
        </section>
    );
}

function PanelHeader({
    name,
    phone,
    badge,
    onEdit,
    onClose,
    editLocked = false,
}: {
    name: string;
    phone?: string;
    badge?: ReactNode;
    onEdit: () => void;
    onClose: () => void;
    editLocked?: boolean;
}) {
    return (
        <div className="flex items-center gap-3 min-inline-0">
            <UserAvatar name={name} size="lg" framed={false} className="shrink-0" />
            <div className="flex-1 min-inline-0">
                <span className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-display text-lg font-medium capitalize text-ink">
                        {name}
                    </span>
                    {badge}
                </span>
                {phone ? (
                    <a
                        href={`tel:+91${phone}`}
                        className="body-sm tabular font-medium text-ink-muted hover:text-brand-text hover:underline"
                    >
                        {formatPhoneIn(phone)}
                    </a>
                ) : (
                    <span className="body-sm text-ink-muted">Number hidden</span>
                )}
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onEdit}
                    title={editLocked ? "Owner details come from the platform" : undefined}
                >
                    {editLocked ? <Lock aria-hidden /> : null} Edit
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    aria-label="Close contact details"
                    onClick={onClose}
                >
                    <X aria-hidden />
                </Button>
            </div>
        </div>
    );
}

function Activity({ lastSpokeAt }: { lastSpokeAt?: string | null }) {
    const events = [
        { title: "Contact created", when: "Saved to contacts" },
        ...(lastSpokeAt
            ? [
                  {
                      title: "Call logged",
                      when: formatRelativePast(new Date(lastSpokeAt), new Date()),
                  },
              ]
            : []),
    ].reverse();
    return (
        <ol className="relative ms-1.5 border-is border-border-warm ps-5">
            {events.map((event) => (
                <li key={event.title} className="relative pbe-4 last:pbe-0">
                    <span
                        className="absolute -inset-s-[23px] inset-bs-1 rounded-full border-2 border-surface bg-brand block-2.5 inline-2.5"
                        aria-hidden
                    />
                    <p className="body-xs font-semibold text-ink">{event.title}</p>
                    <p className="text-[11px] text-ink-muted">{event.when}</p>
                </li>
            ))}
        </ol>
    );
}

function BuyerPanelFooter({ phone, name }: { phone?: string; name: string }) {
    if (!phone) return null;

    return (
        <div className="grid grid-cols-2 gap-2 inline-full">
            <Button
                type="button"
                variant="outline"
                size="md"
                className="inline-full"
                nativeButton={false}
                render={<a href={`tel:+91${phone}`} aria-label={`Call ${name}`} />}
            >
                <Phone aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
                Call
            </Button>
            <Button
                type="button"
                variant="accent"
                size="md"
                className="inline-full"
                nativeButton={false}
                render={
                    <a
                        href={formatWhatsAppUrl(phone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Message ${name} on WhatsApp`}
                    />
                }
            >
                <Icon
                    icon="bi:whatsapp"
                    width={16}
                    height={16}
                    className="block-4 inline-4"
                    aria-hidden
                />
                WhatsApp
            </Button>
        </div>
    );
}

function OwnerPanelFooter({
    value,
    onChange,
    onLogCall,
}: {
    value: string;
    onChange: (value: string) => void;
    onLogCall: () => void;
}) {
    return (
        <>
            <label className="body-xs flex items-center gap-2 font-medium text-ink-muted">
                <CalendarClock aria-hidden className="block-4 inline-4" />
                <span className="hidden sm:inline">Next follow-up</span>
                <input
                    type="date"
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    className="rounded-control border border-border-warm bg-surface px-2 py-1.5 text-ink outline-none focus:border-brand"
                />
            </label>
            <Button type="button" variant="accent" size="sm" onClick={onLogCall}>
                <Phone aria-hidden /> Log a call
            </Button>
        </>
    );
}

type BuyerPanelProps = {
    buyer: BuyerRow;
    onEdit: () => void;
    onAttach: () => void;
    onDetachProperty: (property: ContactPropertyCardItem) => Promise<void>;
    onQuickUpdate: (patch: Partial<BuyerContactForm>) => Promise<void>;
    propertiesRef: React.RefObject<HTMLElement | null>;
};

function sourceLabel(value: string | null | undefined): string {
    if (!value) return "";
    const fromOptions = SOURCE_OPTIONS.find((option) => option.value === value)?.label;
    if (fromOptions) return fromOptions;
    return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function BuyerPanel({
    buyer,
    onEdit,
    onAttach,
    onDetachProperty,
    onQuickUpdate,
    propertiesRef,
}: BuyerPanelProps) {
    const model = toBuyerContactCardModel(buyer);
    const [notes, setNotes] = useState(buyer.details?.notes || buyer.notes || "");
    const [saved, setSaved] = useState(false);
    const [pendingDetach, setPendingDetach] = useState<ContactPropertyCardItem | null>(null);
    const [detachBusy, setDetachBusy] = useState(false);

    const save = async (patch: Partial<BuyerContactForm>) => {
        await onQuickUpdate(patch);
        setSaved(true);
        window.setTimeout(() => setSaved(false), 1400);
    };

    const budget = [buyer.budgetMinInr, buyer.budgetMaxInr]
        .filter((value): value is number => value != null)
        .map((value) => formatIndianPrice(value, buyer.lookingFor))
        .join(" to ");

    const propertyTypesLabel = model.propertyTypes.join(", ");
    const configurationsLabel = model.configurations.join(", ");
    const areasLabel = model.localities.join(", ");
    const source = sourceLabel(buyer.details?.source || buyer.source);

    return (
        <>
            <section className="scroll-mt-5 pbe-6">
                <h3 className="body mbe-4 font-bold text-ink">Requirement</h3>
                <IconFactGrid
                    onAdd={onEdit}
                    facts={[
                        {
                            label: "Looking for",
                            icon: Home,
                            value: buyer.lookingFor === "rent" ? "Rent" : "Buy",
                        },
                        {
                            label: "Property type",
                            icon: Building2,
                            value: propertyTypesLabel,
                            empty: !propertyTypesLabel,
                        },
                        {
                            label: "BHK",
                            icon: BedDouble,
                            value: configurationsLabel,
                            empty: !configurationsLabel,
                        },
                        {
                            label: "Areas",
                            icon: MapPin,
                            value: areasLabel,
                            empty: !areasLabel,
                        },
                        {
                            label: "Budget",
                            icon: IndianRupee,
                            value: budget || model.budgetLabel,
                            wide: true,
                            empty: !budget && model.budgetLabel === "Budget not set",
                        },
                    ]}
                />
            </section>

            <DetailSection title="Matched properties" onAdd={onAttach} sectionRef={propertiesRef}>
                <AttachedPropertyRows
                    properties={model.properties}
                    onAttach={onAttach}
                    onDetach={setPendingDetach}
                    detachingLeadId={detachBusy ? pendingDetach?.leadId : null}
                />
            </DetailSection>

            <AppModal
                open={pendingDetach != null}
                onOpenChange={(next) => {
                    if (!next && !detachBusy) setPendingDetach(null);
                }}
                size="sm"
                title="Remove this property?"
                description={
                    pendingDetach
                        ? `“${pendingDetach.title}” will be unlinked from ${buyer.name}.`
                        : undefined
                }
                footer={
                    <div className="flex flex-row flex-wrap items-center justify-end gap-2 inline-full">
                        <Button
                            type="button"
                            variant="ghost"
                            disabled={detachBusy}
                            onClick={() => setPendingDetach(null)}
                        >
                            Keep linked
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            disabled={detachBusy}
                            loading={detachBusy}
                            onClick={() => {
                                if (!pendingDetach) return;
                                setDetachBusy(true);
                                void onDetachProperty(pendingDetach)
                                    .then(() => setPendingDetach(null))
                                    .finally(() => setDetachBusy(false));
                            }}
                        >
                            Remove property
                        </Button>
                    </div>
                }
            >
                <p className="body text-ink-muted">
                    The listing stays in Your listings. You can attach it again later.
                </p>
            </AppModal>

            <section className="scroll-mt-5 pbe-6">
                <h3 className="body mbe-4 font-bold text-ink">Contact details</h3>
                <IconFactGrid
                    onAdd={onEdit}
                    facts={[
                        {
                            label: "Mobile",
                            icon: Phone,
                            value: formatPhoneIn(buyer.phoneDigits),
                        },
                        {
                            label: "Email",
                            icon: Mail,
                            value: buyer.email,
                            empty: !buyer.email,
                        },
                        {
                            label: "Source",
                            icon: Tag,
                            value: source,
                            empty: !source,
                        },
                    ]}
                />
            </section>

            <section className="scroll-mt-5">
                <div className="mbe-4 flex items-center justify-between gap-2">
                    <h3 className="body flex items-center gap-2 font-bold text-ink">
                        <StickyNote
                            aria-hidden
                            className="text-ink-muted block-5 inline-5"
                            strokeWidth={1.75}
                        />
                        Notes
                    </h3>
                    {saved ? <span className="body-sm font-medium text-success">Saved</span> : null}
                </div>
                <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    onBlur={() => void save({ notes })}
                    placeholder="Add useful context for the next conversation."
                    className="
                      body resize-none rounded-control border-2 border-border-warm bg-surface p-3.5
                      leading-relaxed text-ink outline-none min-block-28 inline-full
                      hover:border-ink-subtle focus:border-ring focus:ring-3 focus:ring-ring/30
                    "
                />
            </section>
        </>
    );
}

type OwnerPanelProps = {
    owner: OwnerRow;
    onEdit: () => void;
    onAttach?: () => void;
    onQuickUpdate: (patch: Partial<OwnerContactForm>) => Promise<void>;
    propertiesRef: React.RefObject<HTMLElement | null>;
};

function OwnerPanel({ owner, onEdit, onAttach, onQuickUpdate, propertiesRef }: OwnerPanelProps) {
    const details = owner.details;
    const model = toOwnerContactCardModel(owner);
    const locked = owner.origin === "platform";
    const photoUrls = useFileUrls(details?.photos);
    const galleryPhotos = useMemo(
        () => [
            ...new Set([
                ...photoUrls,
                ...model.properties
                    .map((property) => property.coverUrl)
                    .filter((url): url is string => Boolean(url)),
            ]),
        ],
        [model.properties, photoUrls],
    );
    const documentUrls = useFileUrls(details?.documents);
    const [status, setStatus] = useState(model.status);
    const [notes, setNotes] = useState(owner.notes || details?.notes || "");
    const [saved, setSaved] = useState(false);
    const save = async (patch: Partial<OwnerContactForm>) => {
        await onQuickUpdate(patch);
        setSaved(true);
        window.setTimeout(() => setSaved(false), 1400);
    };

    const address = [details?.fullAddress, details?.locality, details?.city, details?.pincode]
        .filter(Boolean)
        .join(", ");
    const mapHref =
        details?.lat && details.lng
            ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${details.lat},${details.lng}`)}`
            : "";

    return (
        <>
            <label className="body-xs flex items-center gap-2 text-ink-muted">
                Status
                <select
                    value={status}
                    onChange={(event) => {
                        setStatus(event.target.value);
                        void save({ status: event.target.value });
                    }}
                    className="rounded-md border border-border-warm bg-surface-muted px-2 py-1 font-semibold text-ink"
                >
                    {[
                        "active",
                        "on_hold",
                        "under_negotiation",
                        "sold",
                        "rented_out",
                        "withdrawn",
                    ].map((value) => (
                        <option key={value} value={value}>
                            {value
                                .replaceAll("_", " ")
                                .replace(/\b\w/g, (letter) => letter.toUpperCase())}
                        </option>
                    ))}
                </select>
                {saved ? <span className="text-success">Saved</span> : null}
            </label>

            <ContactPhotoGallery title={owner.name} photos={galleryPhotos} />

            <section ref={propertiesRef} className="scroll-mt-5 border-be border-border-warm pbe-5">
                <p className="text-[11px] font-medium text-ink-subtle">Asking price</p>
                <p className="tabular h3 mbs-1 font-bold text-ink">{model.askingPrice}</p>
                <dl className="mbs-3 grid grid-cols-2 gap-3">
                    <div>
                        <dt className="text-[11px] text-ink-subtle">Property type</dt>
                        <dd className="body-xs font-semibold">{model.propertyType}</dd>
                    </div>
                    <div>
                        <dt className="text-[11px] text-ink-subtle">Configuration</dt>
                        <dd className="body-xs font-semibold">
                            {model.configuration || "Not provided"}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-[11px] text-ink-subtle">Carpet area</dt>
                        <dd className="body-xs font-semibold">
                            {details?.carpetArea
                                ? `${details.carpetArea} ${details.areaUnit}`
                                : "Not provided"}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-[11px] text-ink-subtle">Floor</dt>
                        <dd className="body-xs font-semibold">
                            {details?.floorNumber || "Not provided"}
                        </dd>
                    </div>
                </dl>
            </section>

            <DetailSection
                title="Property details"
                locked={locked}
                onAdd={onEdit}
                entries={[
                    { label: "Society", value: details?.societyName || owner.linkedListingTitle },
                    { label: "Full address", value: address, wide: true },
                    { label: "City", value: details?.city },
                    { label: "Pincode", value: details?.pincode },
                    {
                        label: "Built-up area",
                        value: details?.builtUpArea
                            ? `${details.builtUpArea} ${details.areaUnit}`
                            : "",
                    },
                    {
                        label: "Super built-up",
                        value: details?.superBuiltUpArea
                            ? `${details.superBuiltUpArea} ${details.areaUnit}`
                            : "",
                    },
                    {
                        label: "Plot area",
                        value: details?.plotArea ? `${details.plotArea} ${details.areaUnit}` : "",
                    },
                    { label: "Bathrooms", value: details?.bathrooms },
                    { label: "Balconies", value: details?.balconies },
                    {
                        label: "Parking",
                        value: details?.parkingType
                            ? `${details.parkingType} ${details.parkingCount || ""}`
                            : "",
                    },
                    { label: "Facing", value: details?.facing },
                    { label: "Property age", value: details?.propertyAge },
                    { label: "Available from", value: details?.availableFrom },
                    { label: "Furnishing", value: details?.furnishing },
                    { label: "RERA number", value: details?.reraNumber },
                    {
                        label: "Amenities",
                        value: <ValueChips values={details?.amenities} />,
                        empty: !details?.amenities.length,
                        wide: true,
                    },
                ]}
            />

            {mapHref ? (
                <section className="border-be border-border-warm pbe-5">
                    <h3 className="body-sm mbe-3 font-bold text-ink">Location</h3>
                    <a
                        href={mapHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded-inner border border-border-warm bg-surface-muted p-3 hover:border-brand/35"
                    >
                        <span className="flex items-center gap-2">
                            <MapPin aria-hidden className="text-brand block-5 inline-5" />
                            <span>
                                <span className="body-xs block font-semibold text-ink">
                                    Open property location
                                </span>
                                <span className="tabular text-[11px] text-ink-muted">
                                    {details?.lat}, {details?.lng}
                                </span>
                            </span>
                        </span>
                        <ExternalLink aria-hidden className="text-ink-muted block-4 inline-4" />
                    </a>
                </section>
            ) : null}

            <DetailSection
                title="Price and charges"
                locked={locked}
                onAdd={onEdit}
                entries={[
                    {
                        label: "Expected price",
                        value: details?.expectedPrice
                            ? `${details.expectedPrice} ${details.priceUnit}`
                            : "",
                    },
                    { label: "Expected rent", value: details?.expectedRent },
                    { label: "Deposit", value: details?.deposit },
                    { label: "Maintenance", value: details?.maintenance },
                    {
                        label: "Negotiable",
                        value: details ? (details.negotiable ? "Yes" : "No") : "",
                    },
                ]}
            />

            <DetailSection
                title="Deal terms"
                locked={locked}
                onAdd={onEdit}
                entries={[
                    {
                        label: "Exclusive",
                        value: details ? (details.exclusive ? "Yes" : "No") : "",
                    },
                    { label: "Agreement valid till", value: details?.agreementValidTill },
                    {
                        label: "Brokerage",
                        value: details?.brokerageValue
                            ? `${details.brokerageValue}${details.brokerageType === "percentage" ? "%" : " flat"}`
                            : "",
                    },
                    { label: "Paid by", value: details?.brokeragePaidBy },
                    { label: "Visit days", value: details?.visitDays.join(", ") },
                    {
                        label: "Visit time",
                        value:
                            details?.visitFrom || details?.visitTo
                                ? `${details.visitFrom || "Any"} to ${details.visitTo || "Any"}`
                                : "",
                    },
                ]}
            />

            {owner.linkedListingId ? (
                <section className="border-be border-border-warm pbe-5">
                    <h3 className="body-sm mbe-3 flex items-center gap-2 font-bold text-ink">
                        Linked listing{" "}
                        {locked ? (
                            <Lock aria-hidden className="text-ink-subtle block-3 inline-3" />
                        ) : null}
                    </h3>
                    <Link
                        href={`${BROKER_YOUR_LISTINGS_HREF}?property=${owner.linkedListingId}`}
                        className="flex items-center justify-between rounded-inner border border-border-warm p-3 hover:border-brand/35"
                    >
                        <span>
                            <span className="body-xs block font-semibold text-ink">
                                {owner.linkedListingTitle || "Private listing"}
                            </span>
                            <span className="text-[11px] text-ink-muted">
                                Open in Your Listings
                            </span>
                        </span>
                        <ExternalLink aria-hidden className="block-4 inline-4" />
                    </Link>
                </section>
            ) : onAttach ? (
                <DetailSection title="Linked listing" onAdd={onAttach} sectionRef={propertiesRef}>
                    <AttachedPropertyRows properties={[]} onAttach={onAttach} />
                </DetailSection>
            ) : null}

            <DetailSection title="Interested buyers" locked={locked} entries={[]}>
                <p className="body-xs text-ink-subtle">
                    Buyer interest appears after a buyer is attached to this listing.
                </p>
            </DetailSection>

            {details?.documents.length ? (
                <DetailSection title="Documents" locked={locked}>
                    <div className="flex flex-wrap gap-2">
                        {details.documents.map((file, index) => (
                            <a
                                key={`${file.name}-${index}`}
                                href={documentUrls[index]}
                                download={file.name}
                                className="body-xs flex items-center gap-2 rounded-md border border-border-warm px-2.5 py-2 font-medium text-ink hover:border-brand/35"
                            >
                                <FileText aria-hidden className="block-4 inline-4" />
                                <span>{file.name}</span>
                                <span className="tabular text-ink-muted">
                                    {Math.max(1, Math.round(file.size / 1024))} KB
                                </span>
                                <Download aria-hidden className="block-3.5 inline-3.5" />
                            </a>
                        ))}
                    </div>
                </DetailSection>
            ) : null}

            <DetailSection
                title="Tracking"
                onAdd={onEdit}
                entries={[
                    { label: "Source", value: details?.source },
                    { label: "Status", value: status.replaceAll("_", " ") },
                    {
                        label: "Last spoke",
                        value: owner.lastSpokeAt
                            ? formatDateShort(new Date(owner.lastSpokeAt))
                            : "",
                    },
                    { label: "Next follow-up", value: details?.nextFollowUpAt },
                    {
                        label: "Tags",
                        value: <ValueChips values={owner.tags || details?.tags} />,
                        empty: !(owner.tags || details?.tags)?.length,
                    },
                ]}
            />

            <section className="scroll-mt-5 border-be border-border-warm pbe-6">
                <div className="mbe-4 flex items-center justify-between gap-2">
                    <h3 className="body flex items-center gap-2 font-bold text-ink">
                        <StickyNote
                            aria-hidden
                            className="text-ink-muted block-5 inline-5"
                            strokeWidth={1.75}
                        />
                        Notes
                    </h3>
                    {saved ? <span className="body-sm font-medium text-success">Saved</span> : null}
                </div>
                <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    onBlur={() => void save({ notes })}
                    placeholder="Add context for the next conversation"
                    className="
                      body resize-none rounded-control border-2 border-border-warm bg-surface p-3.5
                      leading-relaxed text-ink outline-none min-block-28 inline-full
                      hover:border-ink-subtle focus:border-ring focus:ring-3 focus:ring-ring/30
                    "
                />
            </section>
            <DetailSection title="Activity">
                <Activity lastSpokeAt={owner.lastSpokeAt} />
            </DetailSection>
        </>
    );
}

export type ContactDetailPanelProps = {
    contact: { type: "buyer"; row: BuyerRow } | { type: "owner"; row: OwnerRow } | null;
    open: boolean;
    initialSection?: "properties";
    onOpenChange: (open: boolean) => void;
    onEditBuyer: (buyer: BuyerRow) => void;
    onEditOwner: (owner: OwnerRow) => void;
    onAttachBuyer: (buyer: BuyerRow) => void;
    onAttachOwner?: (owner: OwnerRow) => void;
    onDetachBuyerProperty: (buyer: BuyerRow, property: ContactPropertyCardItem) => Promise<void>;
    onQuickUpdateBuyer: (buyer: BuyerRow, patch: Partial<BuyerContactForm>) => Promise<void>;
    onQuickUpdateOwner: (owner: OwnerRow, patch: Partial<OwnerContactForm>) => Promise<void>;
};

function ContactPanelSkeleton() {
    return (
        <div className="flex animate-pulse flex-col gap-6" aria-label="Loading contact details">
            <div className="flex items-center gap-3">
                <div className="rounded-full bg-surface-muted block-14 inline-14" />
                <div className="flex flex-col gap-2">
                    <div className="rounded-sm bg-surface-muted block-4 inline-36" />
                    <div className="rounded-sm bg-surface-muted block-3 inline-24" />
                </div>
            </div>
            {[0, 1, 2, 3].map((section) => (
                <div key={section} className="border-be border-border-warm pbe-6">
                    <div className="mbe-4 rounded-sm bg-surface-muted block-4 inline-28" />
                    <div className="grid grid-cols-2 gap-4">
                        {[0, 1, 2, 3].map((row) => (
                            <div key={row} className="flex flex-col gap-2">
                                <div className="rounded-sm bg-surface-muted block-2 inline-16" />
                                <div className="rounded-sm bg-surface-muted block-3 inline-24" />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

export function ContactDetailPanel({
    contact,
    open,
    initialSection,
    onOpenChange,
    onEditBuyer,
    onEditOwner,
    onAttachBuyer,
    onAttachOwner,
    onDetachBuyerProperty,
    onQuickUpdateBuyer,
    onQuickUpdateOwner,
}: ContactDetailPanelProps) {
    const propertiesRef = useRef<HTMLElement>(null);
    const buyer = contact?.type === "buyer" ? contact.row : null;
    const owner = contact?.type === "owner" ? contact.row : null;
    const nextFollowUp = buyer?.details?.nextFollowUpAt || owner?.details?.nextFollowUpAt || "";
    const contactId = contact?.row.id ?? "";
    const [followUpState, setFollowUpState] = useState({ contactId, value: nextFollowUp });
    const followUp = followUpState.contactId === contactId ? followUpState.value : nextFollowUp;

    useEffect(() => {
        if (open && initialSection === "properties")
            window.setTimeout(() => propertiesRef.current?.scrollIntoView({ block: "start" }), 220);
    }, [initialSection, open]);

    if (!contact) {
        if (!open) return null;
        return (
            <AppModal
                open
                onOpenChange={onOpenChange}
                title="Loading contact"
                size="md"
                padding="md"
                className="contacts-detail-drawer"
                headerClassName="
                  !space-y-0 !pbs-(--dialog-pad) !pbe-(--dialog-pad) border-b border-border-warm
                "
                bodyClassName="flex flex-col gap-0"
            >
                <ContactPanelSkeleton />
            </AppModal>
        );
    }
    const row = contact.row;
    const isBuyer = contact.type === "buyer";
    const edit = () =>
        isBuyer ? onEditBuyer(contact.row as BuyerRow) : onEditOwner(contact.row as OwnerRow);
    const badge = owner ? (
        owner.origin === "platform" ? (
            <span
                className="
                  body-xs inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1
                  font-semibold tracking-wide text-brand-text
                "
            >
                Platform
            </span>
        ) : (
            <span
                className="
                  body-xs inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1
                  font-semibold tracking-wide text-brand-text
                "
            >
                <span aria-hidden className="rounded-full bg-success-mid block-1.5 inline-1.5" />
                Added by you
            </span>
        )
    ) : null;
    const phone = row.phoneDigits;

    const saveFollowUp = async (value: string) => {
        setFollowUpState({ contactId, value });
        if (buyer) await onQuickUpdateBuyer(buyer, { nextFollowUpAt: value });
        if (owner) await onQuickUpdateOwner(owner, { nextFollowUpAt: value });
    };
    const logCall = async () => {
        const value = new Date().toISOString().slice(0, 10);
        if (buyer) await onQuickUpdateBuyer(buyer, { lastSpokeAt: value });
        if (owner) await onQuickUpdateOwner(owner, { lastSpokeAt: value });
        toast.success("Call logged");
    };

    return (
        <AppModal
            open={open}
            onOpenChange={onOpenChange}
            title={`${row.name} contact details`}
            size="md"
            padding="md"
            className="contacts-detail-drawer"
            titleClassName="sr-only"
            showCloseButton={false}
            headerClassName="
              !space-y-0 !pbs-(--dialog-pad) !pbe-(--dialog-pad) border-b border-border-warm
            "
            footerClassName="
              !pbs-(--dialog-pad) !pbe-(--dialog-pad) border-t border-border-warm
            "
            header={
                <PanelHeader
                    name={row.name}
                    phone={phone}
                    badge={badge}
                    onEdit={edit}
                    onClose={() => onOpenChange(false)}
                    editLocked={owner?.origin === "platform"}
                />
            }
            footer={
                buyer ? (
                    <BuyerPanelFooter phone={phone} name={buyer.name} />
                ) : (
                    <OwnerPanelFooter
                        value={followUp}
                        onChange={(value) => void saveFollowUp(value)}
                        onLogCall={() => void logCall()}
                    />
                )
            }
            bodyClassName="flex flex-col gap-0"
        >
            {buyer ? (
                <BuyerPanel
                    buyer={buyer}
                    onEdit={edit}
                    onAttach={() => onAttachBuyer(buyer)}
                    onDetachProperty={(property) => onDetachBuyerProperty(buyer, property)}
                    onQuickUpdate={(patch) => onQuickUpdateBuyer(buyer, patch)}
                    propertiesRef={propertiesRef}
                />
            ) : owner ? (
                <OwnerPanel
                    owner={owner}
                    onEdit={edit}
                    onAttach={
                        owner.origin === "custom" && onAttachOwner
                            ? () => onAttachOwner(owner)
                            : undefined
                    }
                    onQuickUpdate={(patch) => onQuickUpdateOwner(owner, patch)}
                    propertiesRef={propertiesRef}
                />
            ) : null}
        </AppModal>
    );
}
