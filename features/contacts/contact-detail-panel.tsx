"use client";

import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

import {
    Building2,
    CalendarClock,
    ChevronLeft,
    ChevronRight,
    Download,
    ExternalLink,
    FileText,
    Link2,
    Lock,
    MapPin,
    MessageCircle,
    MoreHorizontal,
    Phone,
    Plus,
    Trash2,
    X,
} from "lucide-react";

import { formatDateShort, formatRelativePast } from "@/lib/format/date";
import { formatPhoneIn, formatWhatsAppUrl } from "@/lib/format/phone";
import { formatIndianPrice } from "@/lib/format/price";
import { brokerPropertyDetailHref, BROKER_YOUR_LISTINGS_HREF } from "@/lib/routes/broker";
import { cn } from "@/lib/utils";

import { AppImage } from "@/components/shared/app-image";
import { AppModal } from "@/components/shared/app-modal";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
    toBuyerContactCardModel,
    toOwnerContactCardModel,
    type ContactPropertyCardItem,
} from "@/features/contacts/contact-card-model";
import type { BuyerContactForm, OwnerContactForm } from "@/features/contacts/contact-form-model";
import { PropertyCoverStack } from "@/features/contacts/property-cover-stack";
import type { BuyerRow, OwnerRow } from "@/features/contacts/types";

type DetailEntry = {
    label: string;
    value?: ReactNode;
    empty?: boolean;
    wide?: boolean;
};

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
        <section ref={sectionRef} className="scroll-mt-5 border-be border-border-warm pbe-5">
            <div className="mbe-3 flex items-center gap-2">
                <h3 className="body-sm font-bold text-ink">{title}</h3>
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

function PropertyFallback({
    property,
    className,
}: {
    property: ContactPropertyCardItem;
    className?: string;
}) {
    let hash = 0;
    for (const character of property.id) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
    return (
        <span
            className={cn("flex items-center justify-center text-brand-ink", className)}
            style={{ backgroundColor: `hsl(${30 + (hash % 120)} 45% 78%)` }}
        >
            <Building2 aria-hidden className="block-6 inline-6" strokeWidth={1.4} />
        </span>
    );
}

function AttachedPropertyRows({
    properties,
    onAttach,
}: {
    properties: ContactPropertyCardItem[];
    onAttach?: () => void;
}) {
    return (
        <div className="flex flex-col gap-2">
            {properties.map((property) => (
                <div
                    key={property.id}
                    className="group/property flex items-center gap-2 rounded-inner border border-border-warm p-2.5 hover:border-brand/35"
                >
                    <Link
                        href={brokerPropertyDetailHref(property.id)}
                        className="flex flex-1 items-center gap-3 min-inline-0"
                    >
                        <span className="relative shrink-0 overflow-hidden rounded-[10px] block-18 inline-18">
                            <PropertyFallback property={property} className="absolute inset-0" />
                            {property.coverUrl ? (
                                <AppImage
                                    src={property.coverUrl}
                                    alt=""
                                    fill
                                    quality={70}
                                    sizes="72px"
                                />
                            ) : null}
                        </span>
                        <span className="flex-1 min-inline-0">
                            <span className="body-xs block truncate font-semibold text-ink">
                                {property.title}
                            </span>
                            <span className="text-[11px] text-ink-muted">{property.locality}</span>
                            <span className="tabular body-xs block font-semibold text-ink">
                                {property.priceLabel}
                            </span>
                        </span>
                    </Link>
                    <button
                        type="button"
                        disabled
                        title="Detaching properties is not supported by the current API"
                        aria-label={`Remove ${property.title}`}
                        className="rounded-control p-2 text-ink-subtle opacity-45"
                    >
                        <Trash2 aria-hidden className="block-4 inline-4" />
                    </button>
                </div>
            ))}
            {onAttach ? (
                <button
                    type="button"
                    onClick={onAttach}
                    className="body-xs flex items-center gap-2 rounded-inner border border-dashed border-brand/35 px-3 py-3 font-semibold text-brand-text hover:bg-brand-soft/40"
                >
                    <Link2 aria-hidden className="block-4 inline-4" /> Attach property
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
            <UserAvatar
                name={name}
                size="lg"
                fallback="character"
                className="shrink-0 rounded-[16px]"
            />
            <div className="flex-1 min-inline-0">
                <span className="flex flex-wrap items-center gap-2">
                    <span className="h5 truncate font-bold text-ink">{name}</span>
                    {badge}
                </span>
                {phone ? (
                    <a
                        href={`tel:+91${phone}`}
                        className="body-xs tabular font-medium text-ink-muted hover:text-brand-text hover:underline"
                    >
                        {formatPhoneIn(phone)}
                    </a>
                ) : (
                    <span className="body-xs text-ink-muted">Number hidden</span>
                )}
            </div>
            <div className="flex shrink-0 gap-1.5">
                {phone ? (
                    <Button
                        variant="outline"
                        size="icon-sm"
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
                        <MessageCircle aria-hidden />
                    </Button>
                ) : null}
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
                    variant="ghost"
                    size="icon-sm"
                    aria-label="More contact actions"
                >
                    <MoreHorizontal aria-hidden />
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

function PanelFooter({
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
    onQuickUpdate: (patch: Partial<BuyerContactForm>) => Promise<void>;
    propertiesRef: React.RefObject<HTMLElement | null>;
};

function BuyerPanel({ buyer, onEdit, onAttach, onQuickUpdate, propertiesRef }: BuyerPanelProps) {
    const model = toBuyerContactCardModel(buyer);
    const details = buyer.details;
    const [stage, setStage] = useState(details?.stage || "new");
    const [priority, setPriority] = useState(details?.priority || model.priority);
    const [notes, setNotes] = useState(details?.notes || buyer.notes || "");
    const [saved, setSaved] = useState(false);

    const save = async (patch: Partial<BuyerContactForm>) => {
        await onQuickUpdate(patch);
        setSaved(true);
        window.setTimeout(() => setSaved(false), 1400);
    };

    const budget = [buyer.budgetMinInr, buyer.budgetMaxInr]
        .filter((value): value is number => value != null)
        .map((value) => formatIndianPrice(value, buyer.lookingFor))
        .join(" to ");

    return (
        <>
            <div className="flex flex-wrap gap-2">
                <label className="body-xs flex items-center gap-1.5 text-ink-muted">
                    Stage
                    <select
                        value={stage}
                        onChange={(event) => {
                            setStage(event.target.value);
                            void save({ stage: event.target.value });
                        }}
                        className="rounded-md border border-border-warm bg-surface-muted px-2 py-1 font-semibold text-ink"
                    >
                        {["new", "contacted", "qualified", "site_visit", "negotiation"].map(
                            (value) => (
                                <option key={value} value={value}>
                                    {value.replaceAll("_", " ")}
                                </option>
                            ),
                        )}
                    </select>
                </label>
                <label className="body-xs flex items-center gap-1.5 text-ink-muted">
                    Priority
                    <select
                        value={priority}
                        onChange={(event) => {
                            const value = event.target.value as BuyerContactForm["priority"];
                            setPriority(value);
                            void save({ priority: value });
                        }}
                        className="rounded-md border border-border-warm bg-surface-muted px-2 py-1 font-semibold text-ink"
                    >
                        <option value="hot">Hot</option>
                        <option value="warm">Warm</option>
                        <option value="cold">Cold</option>
                    </select>
                </label>
                {saved ? <span className="body-xs self-center text-success">Saved</span> : null}
            </div>

            <DetailSection
                title="Requirement at a glance"
                onAdd={onEdit}
                entries={[
                    { label: "Intent", value: buyer.lookingFor === "rent" ? "Renting" : "Buying" },
                    {
                        label: "Property types",
                        value: <ValueChips values={model.propertyTypes} />,
                        empty: !model.propertyTypes.length,
                    },
                    {
                        label: "Configurations",
                        value: <ValueChips values={model.configurations} />,
                        empty: !model.configurations.length,
                    },
                    { label: "Budget range", value: budget },
                    {
                        label: "Preferred localities",
                        value: model.localities.join(", "),
                        wide: true,
                    },
                    { label: "Move-in timeline", value: details?.timeline },
                ]}
            />

            <DetailSection title="Attached properties" onAdd={onAttach} sectionRef={propertiesRef}>
                <AttachedPropertyRows properties={model.properties} onAttach={onAttach} />
            </DetailSection>

            <DetailSection
                title="Preferences"
                onAdd={onEdit}
                entries={[
                    {
                        label: "Furnishing",
                        value: <ValueChips values={details?.furnishing} />,
                        empty: !details?.furnishing.length,
                    },
                    {
                        label: "Area range",
                        value:
                            details?.areaMin || details?.areaMax
                                ? `${details.areaMin || "Any"} to ${details.areaMax || "Any"} ${details.areaUnit}`
                                : "",
                    },
                    { label: "Purpose", value: details?.purpose },
                    { label: "Parking", value: details?.parking },
                    {
                        label: "Facing",
                        value: <ValueChips values={details?.facing} />,
                        empty: !details?.facing.length,
                    },
                    { label: "Floor preference", value: details?.floorPreference },
                    {
                        label: "Vastu",
                        value: details ? (details.vastu ? "Required" : "Not required") : "",
                    },
                    {
                        label: "Must-have amenities",
                        value: <ValueChips values={details?.amenities} />,
                        empty: !details?.amenities.length,
                        wide: true,
                    },
                ]}
            />

            <DetailSection
                title="Finance"
                onAdd={onEdit}
                entries={[
                    { label: "Loan status", value: details?.loanStatus?.replaceAll("_", " ") },
                    { label: "Loan amount", value: details?.loanAmount },
                    {
                        label: "Token ready",
                        value: details ? (details.tokenReady ? "Yes" : "No") : "",
                    },
                    {
                        label: "Brokerage",
                        value: details?.brokerageValue
                            ? `${details.brokerageValue}${details.brokerageType === "percentage" ? "%" : " flat"}`
                            : "",
                    },
                ]}
            />

            <DetailSection
                title="Lead details"
                onAdd={onEdit}
                entries={[
                    {
                        label: "Source",
                        value: details?.source || buyer.source?.replaceAll("_", " "),
                    },
                    { label: "Referred by", value: details?.referredBy },
                    {
                        label: "Assigned to",
                        value: details?.assignedTo === "me" ? "You" : details?.assignedTo,
                    },
                    {
                        label: "Tags",
                        value: <ValueChips values={details?.tags} />,
                        empty: !details?.tags.length,
                    },
                    { label: "Email", value: buyer.email },
                ]}
            />

            <section className="border-be border-border-warm pbe-5">
                <div className="mbe-3 flex items-center justify-between">
                    <h3 className="body-sm font-bold text-ink">Notes</h3>
                    {saved ? <span className="body-xs text-success">Saved</span> : null}
                </div>
                <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    onBlur={() => void save({ notes })}
                    placeholder="Add context for the next conversation"
                    className="body-xs resize-none rounded-inner border border-border-warm bg-surface-muted p-3 text-ink outline-none min-block-24 inline-full focus:border-brand focus:ring-2 focus:ring-brand/15"
                />
            </section>

            <DetailSection title="Activity">
                <Activity lastSpokeAt={buyer.lastContactedAt} />
            </DetailSection>
        </>
    );
}

type OwnerPanelProps = {
    owner: OwnerRow;
    onEdit: () => void;
    onQuickUpdate: (patch: Partial<OwnerContactForm>) => Promise<void>;
    propertiesRef: React.RefObject<HTMLElement | null>;
};

function OwnerPanel({ owner, onEdit, onQuickUpdate, propertiesRef }: OwnerPanelProps) {
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

            <section className="border-be border-border-warm pbe-5">
                <div className="mbe-3 flex items-center justify-between">
                    <h3 className="body-sm font-bold text-ink">Notes</h3>
                    {saved ? <span className="body-xs text-success">Saved</span> : null}
                </div>
                <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    onBlur={() => void save({ notes })}
                    placeholder="Add context for the next conversation"
                    className="body-xs resize-none rounded-inner border border-border-warm bg-surface-muted p-3 text-ink outline-none min-block-24 inline-full focus:border-brand focus:ring-2 focus:ring-brand/15"
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
    onQuickUpdateBuyer: (buyer: BuyerRow, patch: Partial<BuyerContactForm>) => Promise<void>;
    onQuickUpdateOwner: (owner: OwnerRow, patch: Partial<OwnerContactForm>) => Promise<void>;
};

function ContactPanelSkeleton() {
    return (
        <div className="flex animate-pulse flex-col gap-6" aria-label="Loading contact details">
            <div className="flex items-center gap-3">
                <div className="rounded-[16px] bg-surface-muted block-14 inline-14" />
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
                bodyClassName="p-5"
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
            <Badge variant="brand">Platform</Badge>
        ) : (
            <Badge variant="outline">Added by you</Badge>
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
                <PanelFooter
                    value={followUp}
                    onChange={(value) => void saveFollowUp(value)}
                    onLogCall={() => void logCall()}
                />
            }
            bodyClassName="flex flex-col gap-5"
        >
            {buyer ? (
                <BuyerPanel
                    buyer={buyer}
                    onEdit={edit}
                    onAttach={() => onAttachBuyer(buyer)}
                    onQuickUpdate={(patch) => onQuickUpdateBuyer(buyer, patch)}
                    propertiesRef={propertiesRef}
                />
            ) : owner ? (
                <OwnerPanel
                    owner={owner}
                    onEdit={edit}
                    onQuickUpdate={(patch) => onQuickUpdateOwner(owner, patch)}
                    propertiesRef={propertiesRef}
                />
            ) : null}
        </AppModal>
    );
}
