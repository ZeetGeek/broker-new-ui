"use client";

import { type ReactNode, useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";

import { useQueryClient } from "@tanstack/react-query";

import { propertiesApi } from "@/lib/api/properties";
import { formatAreaSqft } from "@/lib/format/area";
import { toLegacyAmountFields } from "@/lib/format/listing-availability";
import { formatPriceInr, formatRentInr } from "@/lib/format/price";
import { cn } from "@/lib/utils";
import { amenityLabel } from "@/lib/validation/property";

import {
    type AppIcon,
    Armchair,
    ArrowLeft,
    Bath,
    BedDouble,
    Bookmark,
    Building2,
    CalendarCheck,
    CalendarClock,
    Car,
    Check,
    ChevronRight,
    Clock,
    Compass,
    DoorOpen,
    Droplets,
    Dumbbell,
    ExternalLink,
    Fence,
    HandCoins,
    Hash,
    Home,
    Landmark,
    Layers,
    Map,
    MapPin,
    Monitor,
    Route,
    Ruler,
    ShieldCheck,
    Tags,
    Trees,
    Users,
    Zap,
} from "@/components/shared/icons";
import { PriceWithCommission } from "@/components/shared/price-with-commission";
import { PropertySharePopover } from "@/components/shared/property-share-popover";
import { RotatingHeaderSummary } from "@/components/shared/rotating-header-summary";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { NEARBY_PLACE_TYPE_OPTIONS, toLabel } from "@/constants/property";
import {
    NEARBY_PLACE_FALLBACK_ICON,
    NEARBY_PLACE_ICONS,
} from "@/features/properties/property-form/option-icons";

import { SAVED_PROPERTIES_QUERY_KEY } from "../saved-properties/saved-properties-query";
import type { MyListingItem } from "../your-listings/types";

import {
    buildPropertyFacts,
    listedAgoLabel,
    propertyDetailFieldVisible,
} from "./property-detail-facts";
import { PropertyGallery } from "./property-gallery";

import styles from "./property-detail.module.css";

const FACT_ICONS: Record<string, AppIcon> = {
    bhk: BedDouble,
    bathrooms: Bath,
    balconies: DoorOpen,
    area: Ruler,
    carpetArea: Ruler,
    category: Tags,
    type: Building2,
    furnishing: Armchair,
    floor: Layers,
    totalFloors: Layers,
    facing: Compass,
    propertyAge: CalendarClock,
    condition: ShieldCheck,
    parking: Car,
    maintenance: HandCoins,
    available: CalendarCheck,
    securityDeposit: ShieldCheck,
    cabins: DoorOpen,
    meetingRooms: Users,
    workstations: Monitor,
    ceilingHeight: Ruler,
};
const AMENITY_ICONS: Record<string, AppIcon> = {
    lift: Layers,
    power_backup: Zap,
    covered_parking: Car,
    gated_community: Fence,
    security: ShieldCheck,
    gym: Dumbbell,
    swimming_pool: Droplets,
    play_area: Users,
    garden: Trees,
    clubhouse: Building2,
    water_supply: Droplets,
    ev_charging: Zap,
    parking: Car,
};

function PropertyFactsList({ facts }: { facts: ReturnType<typeof buildPropertyFacts> }) {
    return (
        <dl className={styles.facts}>
            {facts.map((fact) => {
                const Icon = FACT_ICONS[fact.key] ?? Building2;
                return (
                    <div className={styles.fact} key={fact.key}>
                        <dt>
                            <Icon size={22} strokeWidth={1.5} aria-hidden />
                            <span>{fact.label}</span>
                        </dt>
                        <dd>{fact.value}</dd>
                    </div>
                );
            })}
        </dl>
    );
}

export function PropertyDetailLayout({
    item,
    backHref,
    backLabel,
    status,
    statusColor = "stone",
    actions,
    editHref,
    rail,
    mobileAction,
    audience,
    revealAddress = true,
}: {
    item: MyListingItem;
    backHref: string;
    backLabel: string;
    status: string;
    statusColor?: "stone" | "emerald" | "amber";
    actions?: ReactNode;
    editHref?: string;
    rail: ReactNode;
    mobileAction: ReactNode;
    audience: "broker" | "owner";
    revealAddress?: boolean;
}) {
    const { amountInr, isRent } = toLegacyAmountFields(item);
    const hasPrice = (isRent ? item.rentAmountInr : item.saleAmountInr) != null;
    const queryClient = useQueryClient();
    const [saved, setSaved] = useState(Boolean(item.isBookmarked));
    const [saving, setSaving] = useState(false);
    const headerFacts = buildPropertyFacts(item);
    const headerLocation = item.locality || item.city;
    const summaryLines = [
        `${item.propertyTypeLabel}${headerLocation ? ` in ${headerLocation}` : ""}`,
        item.transactionType === "both"
            ? "For sale & rent"
            : item.transactionType === "rent"
              ? "For rent"
              : "For sale",
        item.areaSqft > 0
            ? `${formatAreaSqft(item.areaSqft)}${headerFacts.some((fact) => fact.key === "bhk") ? ` · ${item.configLabel}` : ""}`
            : null,
        headerFacts.find((fact) => fact.key === "furnishing")?.value,
        headerFacts.find((fact) => fact.key === "condition")?.value,
    ].filter((line): line is string => Boolean(line));
    async function toggleSave() {
        if (saving) return;
        setSaving(true);
        try {
            if (saved) await propertiesApi.unbookmark(item.id);
            else await propertiesApi.bookmark(item.id);
            setSaved(!saved);
            void queryClient.invalidateQueries({ queryKey: SAVED_PROPERTIES_QUERY_KEY });
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Couldn't update saved property");
        } finally {
            setSaving(false);
        }
    }
    return (
        <div className={styles.page} data-property-detail>
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <Button
                        variant="link"
                        size="md"
                        className={styles.back}
                        render={<Link href={backHref} />}
                    >
                        <ArrowLeft aria-hidden />
                        Back to {backLabel.toLowerCase()}
                    </Button>
                    <h1>
                        <span>Property details.</span>{" "}
                        <RotatingHeaderSummary
                            key={item.id}
                            lines={[...new Set(summaryLines)]}
                            loadingPlaceholder={item.title}
                        />
                    </h1>
                    <div className={styles.propertyMeta}>
                        <span className={styles.location}>
                            <span className={styles.locationIcon}>
                                <MapPin size={18} strokeWidth={1.75} aria-hidden />
                            </span>
                            {[item.locality, item.city, item.country].filter(Boolean).join(", ")}
                        </span>
                        <Badge color={statusColor}>{status}</Badge>
                        <span className={styles.listed}>
                            <Clock size={15} strokeWidth={1.75} aria-hidden />
                            Listed {listedAgoLabel(item.listedDaysAgo).toLowerCase()}
                        </span>
                    </div>
                </div>
                <div className={styles.headerActions}>
                    <PropertySharePopover
                        iconOnly
                        className={styles.circleButton}
                        listing={{
                            id: item.id,
                            title: item.title,
                            locality: item.locality,
                            city: item.city,
                            priceLabel: isRent
                                ? formatRentInr(amountInr)
                                : formatPriceInr(amountInr),
                            imageSrc: item.imageSrc,
                            configLabel: item.configLabel,
                            propertyTypeLabel: item.propertyTypeLabel,
                            areaSqft: item.areaSqft,
                            bhk: item.bhk,
                            listingKind: isRent ? "rent" : "sale",
                        }}
                    />
                    <Button
                        type="button"
                        variant="surface"
                        size="icon"
                        className={styles.circleButton}
                        aria-label={saved ? "Unsave property" : "Save property"}
                        aria-pressed={saved}
                        disabled={saving}
                        onClick={() => void toggleSave()}
                    >
                        <Bookmark aria-hidden size={20} fill={saved ? "currentColor" : "none"} />
                    </Button>
                    {actions}
                </div>
            </header>
            <div className={styles.fullWidthGallery}>
                <PropertyGallery
                    title={item.title}
                    imageSrcs={item.imageSrcs}
                    editHref={editHref}
                />
            </div>
            <div className={styles.bodyGrid}>
                <PropertyDetailContent item={item} revealAddress={revealAddress} />
                <aside className={styles.rail} aria-label="Property actions">
                    {rail}
                </aside>
            </div>
            <div className={styles.mobileBar}>
                <div className={styles.mobilePrice}>
                    {hasPrice ? (
                        <PriceWithCommission
                            amountInr={amountInr}
                            isRent={isRent}
                            commissionPercent={item.commissionPercent}
                            commissionAmountInr={item.commissionAmount}
                            audience={audience}
                            size="lg"
                        />
                    ) : (
                        <strong>Price on request</strong>
                    )}
                    <span>{isRent ? "Monthly rent" : "Asking price"}</span>
                </div>
                {mobileAction}
            </div>
        </div>
    );
}

export function PropertyDetailContent({
    item,
    revealAddress,
    locationHint = "Exact address is shared after representation is approved.",
}: {
    item: MyListingItem;
    revealAddress: boolean;
    locationHint?: string;
}) {
    const [expanded, setExpanded] = useState(false);
    const facts = buildPropertyFacts(item);
    const termKeys = new Set(["securityDeposit", "maintenance", "available"]);
    const propertyFacts = facts.filter((fact) => !termKeys.has(fact.key));
    const terms = facts.filter((fact) => termKeys.has(fact.key));
    const highlights = [
        { key: "bhk", icon: BedDouble, caption: "Configuration" },
        { key: "area", icon: Ruler, caption: "Property area" },
        { key: "bathrooms", icon: Bath, caption: "Bathrooms" },
        { key: "furnishing", icon: Armchair, caption: "Furnishing" },
    ]
        .flatMap(({ key, icon, caption }) => {
            const fact = facts.find((f) => f.key === key);
            return fact ? [{ ...fact, icon, caption }] : [];
        })
        .slice(0, 3);
    const longDescription = item.description.length > 400;
    const publicLocation = [item.locality, item.city, item.state, item.country]
        .filter(Boolean)
        .join(", ");
    const address = revealAddress
        ? [
              ...new Set(
                  [
                      item.unitNumber,
                      item.society,
                      item.streetOrRoad,
                      item.address !== item.locality ? item.address : null,
                      item.locality,
                      item.city,
                      item.state,
                      item.country,
                  ].filter(Boolean),
              ),
          ].join(", ")
        : publicLocation;
    const locationFacts = [
        item.society
            ? { key: "society", label: "Project or society", value: item.society, icon: Building2 }
            : null,
        revealAddress && item.unitNumber
            ? { key: "unit", label: "Flat or unit no.", value: item.unitNumber, icon: Home }
            : null,
        revealAddress && item.streetOrRoad
            ? { key: "street", label: "Street or road", value: item.streetOrRoad, icon: Route }
            : null,
        item.city ? { key: "city", label: "City", value: item.city, icon: Map } : null,
        item.state ? { key: "state", label: "State", value: item.state, icon: Map } : null,
        item.country ? { key: "country", label: "Country", value: item.country, icon: Map } : null,
        revealAddress && item.pinCode
            ? { key: "pincode", label: "Pincode", value: item.pinCode, icon: Hash }
            : null,
        revealAddress && item.landmark
            ? { key: "landmark", label: "Nearby landmark", value: item.landmark, icon: Landmark }
            : null,
    ].filter(
        (
            fact,
        ): fact is {
            key: string;
            label: string;
            value: string;
            icon: AppIcon;
        } => fact != null,
    );
    const media = [
        { label: "Watch property video", href: item.videoUrl },
        { label: "Take a virtual tour", href: item.virtualTourUrl },
    ].filter(({ href }) => /^https?:\/\//i.test(href));

    return (
        <div className={styles.content}>
            <section className={styles.overview}>
                <h2>
                    {item.propertyTypeLabel}
                    {item.locality ? ` in ${item.locality}` : ""}
                </h2>
                <p>
                    {item.transactionType === "both"
                        ? "Available for sale and rent"
                        : item.transactionType === "rent"
                          ? "Available for rent"
                          : "Available for sale"}
                    {item.society ? ` · ${item.society}` : ""}
                </p>
                <div
                    className={styles.highlights}
                    style={{
                        gridTemplateColumns: `repeat(${Math.max(1, highlights.length)}, minmax(0, 1fr))`,
                    }}
                >
                    {highlights.map(({ key, value, caption, icon: Icon }) => (
                        <div key={key} className={styles.highlight}>
                            <Icon size={24} strokeWidth={1.5} aria-hidden />
                            <strong>{value}</strong>
                            <span>{caption}</span>
                        </div>
                    ))}
                </div>
            </section>
            {item.description.trim() ? (
                <section className={styles.section}>
                    <h2>About this property</h2>
                    <p
                        id={`description-${item.id}`}
                        className={cn(
                            styles.description,
                            longDescription && !expanded && "line-clamp-6",
                        )}
                    >
                        {item.description}
                    </p>
                    {longDescription ? (
                        <Button
                            type="button"
                            variant="link"
                            className={styles.readMore}
                            aria-expanded={expanded}
                            aria-controls={`description-${item.id}`}
                            onClick={() => setExpanded(!expanded)}
                        >
                            {expanded ? "Show less" : "Show more"}
                            <ChevronRight size={16} aria-hidden />
                        </Button>
                    ) : null}
                </section>
            ) : null}
            <section className={styles.section}>
                <h2>A closer look</h2>
                <PropertyFactsList facts={propertyFacts} />
            </section>
            {terms.length > 0 ? (
                <section className={styles.section}>
                    <h2>Costs & availability</h2>
                    <PropertyFactsList facts={terms} />
                </section>
            ) : null}
            {item.amenities.length > 0 ? (
                <section className={styles.section}>
                    <h2>What this property offers</h2>
                    <ul className={styles.amenities}>
                        {item.amenities.map((amenity) => {
                            const Icon =
                                AMENITY_ICONS[amenity.toLowerCase().replace(/[\s/]+/g, "_")] ??
                                Check;
                            return (
                                <li className={styles.amenity} key={amenity}>
                                    <Icon size={22} strokeWidth={1.5} aria-hidden />
                                    {amenityLabel(amenity)}
                                </li>
                            );
                        })}
                    </ul>
                </section>
            ) : null}
            {propertyDetailFieldVisible(item, "details.commercial.suitableFor") &&
            item.suitableFor.length > 0 ? (
                <section className={styles.section}>
                    <h2>Suitable for</h2>
                    <ul className={styles.amenities}>
                        {item.suitableFor.map((use) => (
                            <li key={use} className={styles.amenity}>
                                <Check size={22} strokeWidth={1.5} aria-hidden />
                                {amenityLabel(use)}
                            </li>
                        ))}
                    </ul>
                </section>
            ) : null}
            {propertyDetailFieldVisible(item, "location.nearbyPlaces") &&
            item.nearbyPlaces.length > 0 ? (
                <section className={styles.section}>
                    <h2>Nearby places</h2>
                    <ul className={styles.nearby}>
                        {item.nearbyPlaces.map((place) => (
                            <li key={place}>
                                <span className={styles.nearbyIcon} aria-hidden>
                                    {NEARBY_PLACE_ICONS[place] ?? NEARBY_PLACE_FALLBACK_ICON}
                                </span>
                                <span>
                                    {NEARBY_PLACE_TYPE_OPTIONS.find(
                                        (option) => option.value === place,
                                    )?.label ?? toLabel(place)}
                                </span>
                            </li>
                        ))}
                    </ul>
                </section>
            ) : null}
            <section className={styles.section}>
                <h2>Location</h2>
                <div className={styles.address}>
                    <div>
                        <div className={styles.addressLabel}>
                            <MapPin size={24} strokeWidth={1.75} aria-hidden />
                            <span>{revealAddress ? "Full address" : "Area"}</span>
                        </div>
                        <p>
                            {address || "Location not provided"}
                            {revealAddress && item.pinCode ? `, ${item.pinCode}` : ""}
                        </p>
                        <small>{!revealAddress ? locationHint : ""}</small>
                    </div>
                </div>
                {locationFacts.length > 0 ? (
                    <dl className={styles.locationFacts}>
                        {locationFacts.map(({ key, label, value, icon: Icon }) => (
                            <div key={key} className={styles.locationFact}>
                                <dt>
                                    <Icon size={18} strokeWidth={1.5} aria-hidden />
                                    {label}
                                </dt>
                                <dd>{value}</dd>
                            </div>
                        ))}
                    </dl>
                ) : null}
            </section>
            {media.length > 0 ? (
                <section className={styles.section}>
                    <h2>Explore the property</h2>
                    <div className={styles.mediaLinks}>
                        {media.map(({ label, href }) => (
                            <a key={label} href={href} target="_blank" rel="noopener noreferrer">
                                {label}
                                <ExternalLink size={18} aria-hidden />
                            </a>
                        ))}
                    </div>
                </section>
            ) : null}
        </div>
    );
}
