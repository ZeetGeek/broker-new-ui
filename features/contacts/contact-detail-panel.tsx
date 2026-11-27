"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

import { canEditExclusiveOwners } from "@/lib/api/exclusive-owners";
import { formatPersonName } from "@/lib/format/person-name";
import { formatPhoneIn, formatTelUrl, formatWhatsAppUrl } from "@/lib/format/phone";
import { formatListingPrice } from "@/lib/format/price";
import { brokerPropertyDetailHref } from "@/lib/routes/broker";
import { cn } from "@/lib/utils";
import { useMarketCurrency } from "@/hooks/use-market";

import { EmptyState } from "@/components/empty-state";
import { AppModal } from "@/components/shared/app-modal";
import { AppModalFooter } from "@/components/shared/app-modal-footer";
import { DrawerSection, revealDrawerSections } from "@/components/shared/drawer-section";
import { IconButton } from "@/components/shared/icon-button";
import {
    type AppIcon,
    Building2,
    CallIcon,
    currencyIcon,
    Globe2,
    Home,
    Link2,
    Lock,
    Mail,
    MapPin,
    Pencil,
    Phone,
    Plus,
    RefreshCw,
    Tag,
    Trash2,
    UserRound,
    WhatsAppIcon,
} from "@/components/shared/icons";
import { PropertyCoverImage } from "@/components/shared/property-cover-image";
import { UserAvatar } from "@/components/shared/user-avatar";
import { WorkflowLink as Link } from "@/components/shared/workflow-link";
import { Button } from "@/components/ui/button";

import { FEATURE_RERA_VERIFICATION } from "@/config/index";
import { FEATURE_PLATFORM_OWNER } from "@/config/index";
import { SOURCE_OPTIONS } from "@/features/contacts/buyer-options";
import {
    type ContactPropertyCardItem,
    toBuyerContactCardModel,
    toOwnerContactCardModel,
} from "@/features/contacts/contact-card-model";
import type { BuyerContactForm, OwnerContactForm } from "@/features/contacts/contact-form-model";
import { contactLocationDefaults } from "@/features/contacts/contact-location-defaults";
import { ContactNotes } from "@/features/contacts/contact-notes";
import type { BuyerRow, OwnerRow } from "@/features/contacts/types";

import styles from "./contacts-responsive.module.css";

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
    icon: AppIcon;
};

function IconFactGrid({ facts, onAdd }: { facts: IconFact[]; onAdd?: () => void }) {
    const filled = facts.filter((fact) => hasValue(fact.value, fact.empty));
    if (!filled.length) {
        return onAdd ? (
            <button
                type="button"
                onClick={onAdd}
                className="
                  body-sm flex items-center gap-2 font-semibold text-brand-text
                  hover:underline
                "
            >
                <Plus aria-hidden className="block-4 inline-4" /> Add details
            </button>
        ) : (
            <p className="body-sm text-ink-subtle">No details yet</p>
        );
    }

    // Open field grid (Add buyer style) — no nested cell borders, so no double lines.
    return (
        <dl
            className={cn(
                styles.factGrid,
                "grid grid-cols-1 @min-[24rem]/contact-drawer:grid-cols-2",
            )}
        >
            {filled.map((fact, index) => {
                const IconGlyph = fact.icon;
                const aloneOnLastRow =
                    !fact.wide && filled.length % 2 === 1 && index === filled.length - 1;
                return (
                    <div
                        key={fact.label}
                        className={cn(
                            "flex items-start gap-2 min-inline-0",
                            (fact.wide || aloneOnLastRow) &&
                                "@min-[24rem]/contact-drawer:col-span-2",
                        )}
                    >
                        <IconGlyph
                            aria-hidden
                            className="mbs-0.5 shrink-0 text-ink-muted block-4 inline-4"
                            strokeWidth={1.75}
                        />
                        <div className="flex-1 min-inline-0">
                            <dt className="body-sm text-ink-muted">{fact.label}</dt>
                            <dd
                                className={cn(
                                    styles.factValue,
                                    "body mbs-0.5 font-medium text-ink",
                                )}
                            >
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
        <DrawerSection
            sectionRef={sectionRef}
            title={title}
            description="See the properties linked to this contact."
            headingLevel={3}
        >
            {locked ? (
                <div className="mbe-4 flex items-center gap-2">
                    <span
                        className="body-xs flex items-center gap-1 text-ink-subtle"
                        title="Owner details come from the platform"
                    >
                        <Lock aria-hidden className="block-3 inline-3" /> Platform managed
                    </span>
                </div>
            ) : null}

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
                                <dt className="body-xs font-medium text-ink-subtle">
                                    {entry.label}
                                </dt>
                                <dd className="body-xs mbs-1 font-medium wrap-break-word text-ink">
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
                                            className="
                                              inline-flex items-center gap-1 font-semibold
                                              text-brand-text
                                              hover:underline
                                            "
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
                    className="
                      body-xs flex items-center gap-2 font-semibold text-brand-text
                      hover:underline
                    "
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
        </DrawerSection>
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
                        className="
                          group/property flex items-center gap-2 rounded-inner border
                          border-border-warm bg-surface p-2.5 shadow-xs
                          hover:border-brand/35
                        "
                    >
                        <Link
                            href={brokerPropertyDetailHref(property.id)}
                            className="flex flex-1 items-center gap-3 min-inline-0"
                        >
                            <PropertyCoverImage
                                src={property.coverUrl}
                                alt=""
                                sizes="72px"
                                size={72}
                                className={styles.propertyCover}
                            />
                            <span className="flex-1 min-inline-0">
                                <span
                                    title={property.title}
                                    className="body-sm block truncate font-medium text-ink"
                                >
                                    {property.title}
                                </span>
                                <span className="body-xs wrap-anywhere text-ink-muted">
                                    {property.locality}
                                </span>
                                <span
                                    className="
                                  tabular body-sm mbs-0.5 block font-medium text-brand
                                "
                                >
                                    {property.priceLabel}
                                </span>
                            </span>
                        </Link>
                        {canDetach ? (
                            <IconButton
                                tone="danger"
                                type="button"
                                size="sm"
                                disabled={busy || Boolean(detachingLeadId)}
                                loading={busy}
                                aria-label={`Remove ${property.title}`}
                                className=""
                                onClick={() => onDetach?.(property)}
                            >
                                <Trash2 aria-hidden className="block-4 inline-4" />
                            </IconButton>
                        ) : null}
                    </div>
                );
            })}
            {onAttach ? (
                <button
                    type="button"
                    onClick={onAttach}
                    className="
                      body-sm flex items-center justify-center gap-2 rounded-inner border
                      border-dashed border-brand/40 px-3 py-3.5 font-semibold text-brand-text
                      hover:bg-brand-soft/50
                    "
                >
                    <Link2 aria-hidden className="block-4 inline-4" />
                    {attachLabel}
                </button>
            ) : null}
        </div>
    );
}

function ContactSummary({
    name,
    phone,
    avatarUrl,
    badge,
    onEdit,
    editLocked = false,
    editAvailable = true,
}: {
    name: string;
    phone?: string;
    avatarUrl?: string;
    badge?: ReactNode;
    onEdit: () => void;
    editLocked?: boolean;
    editAvailable?: boolean;
}) {
    return (
        <div className={styles.summary}>
            <UserAvatar
                name={name}
                imageUrl={avatarUrl}
                size="sm"
                framed={false}
                className="shrink-0"
            />
            <div className="flex-1 min-inline-0">
                <span className="flex items-center gap-2 min-inline-0">
                    <span title={name} className={cn(styles.summaryName, "text-ink")}>
                        {name}
                    </span>
                    {badge}
                </span>
                {phone ? (
                    <a
                        href={formatTelUrl(phone)}
                        className={cn(
                            styles.summaryPhone,
                            `
                          tabular text-ink-muted
                          hover:text-brand-text hover:underline
                        `,
                        )}
                    >
                        {formatPhoneIn(phone)}
                    </a>
                ) : (
                    <span className={cn(styles.summaryPhone, "text-ink-muted")}>Number hidden</span>
                )}
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
                {editLocked ? null : (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="min-block-11"
                        onClick={onEdit}
                        disabled={!editAvailable}
                        title={editAvailable ? undefined : "Owner editing is not available yet"}
                    >
                        <Pencil aria-hidden />
                        Edit
                    </Button>
                )}
            </div>
        </div>
    );
}

function ContactCallFooter({ phone, name }: { phone?: string; name: string }) {
    if (!phone) return null;

    return (
        <AppModalFooter className={cn(styles.callActions, "grid grid-cols-2 gap-2 inline-full")}>
            <Button
                type="button"
                variant="outline"
                size="md"
                className="inline-full"
                nativeButton={false}
                render={<a href={formatTelUrl(phone)} aria-label={`Call ${name}`} />}
            >
                <CallIcon aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
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
                <WhatsAppIcon aria-hidden className="block-4 inline-4" />
                WhatsApp
            </Button>
        </AppModalFooter>
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

function ownerTypeLabel(value: string | null | undefined): string {
    if (!value) return "";
    if (value === "individual") return "Individual";
    if (value === "builder") return "Builder";
    if (value === "company") return "Company";
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
    const CurrencyIcon = currencyIcon(useMarketCurrency().code);
    const model = toBuyerContactCardModel(buyer);
    const [pendingDetach, setPendingDetach] = useState<ContactPropertyCardItem | null>(null);
    const [detachBusy, setDetachBusy] = useState(false);

    const saleBudget = [buyer.budgetMinInr, buyer.budgetMaxInr]
        .filter((value): value is number => value != null)
        .map((value) => formatListingPrice(value, "buy"))
        .join(" to ");
    const rentBudget = [buyer.rentBudgetMinInr, buyer.rentBudgetMaxInr]
        .filter((value): value is number => value != null)
        .map((value) => formatListingPrice(value, "rent"))
        .join(" to ");

    const areasLabel = model.localities.join(", ");
    const source = sourceLabel(buyer.details?.source || buyer.source);
    const fallback = contactLocationDefaults();
    const country = buyer.country?.trim() || fallback.country;
    const state = buyer.state?.trim() || fallback.state;
    const city = buyer.city?.trim() || fallback.city;

    return (
        <>
            <DrawerSection
                title="Property needs"
                description="Review preferred locations, property requirements and budgets."
            >
                <IconFactGrid
                    onAdd={onEdit}
                    facts={[
                        {
                            label: "Looking for",
                            icon: Home,
                            value:
                                buyer.lookingFor === "rent"
                                    ? "Rent"
                                    : buyer.lookingFor === "both"
                                      ? "Both"
                                      : "Buy",
                        },
                        {
                            label: "Country",
                            icon: Globe2,
                            value: country,
                        },
                        {
                            label: "State",
                            icon: MapPin,
                            value: state,
                        },
                        {
                            label: "City",
                            icon: Building2,
                            value: city,
                        },
                        {
                            label: "Preferred area",
                            icon: MapPin,
                            value: areasLabel || "—",
                        },
                        ...(buyer.lookingFor !== "rent"
                            ? [
                                  {
                                      label: "Sale budget",
                                      icon: CurrencyIcon,
                                      value: saleBudget || "—",
                                      wide: true,
                                      empty: !saleBudget,
                                  },
                              ]
                            : []),
                        ...(buyer.lookingFor !== "buy"
                            ? [
                                  {
                                      label: "Rent budget",
                                      icon: CurrencyIcon,
                                      value: rentBudget || "—",
                                      wide: true,
                                      empty: !rentBudget,
                                  },
                              ]
                            : []),
                    ]}
                />
            </DrawerSection>

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
                    <AppModalFooter
                        className="
                      flex flex-row flex-wrap items-center justify-end gap-2 inline-full
                    "
                        secondaryLabel="Keep linked"
                        secondaryVariant="ghost"
                        secondaryDisabled={detachBusy}
                        onSecondary={() => setPendingDetach(null)}
                        primaryLabel="Remove property"
                        primaryType="button"
                        primaryVariant="destructive"
                        primaryDisabled={detachBusy}
                        primaryLoading={detachBusy}
                        onPrimary={() => {
                            if (!pendingDetach) return;
                            setDetachBusy(true);
                            void onDetachProperty(pendingDetach)
                                .then(() => setPendingDetach(null))
                                .finally(() => setDetachBusy(false));
                        }}
                    />
                }
            >
                <p className="body text-ink-muted">
                    The listing stays in My Listings. You can attach it again later.
                </p>
            </AppModal>

            <DrawerSection
                title="Contact details"
                description="Find the client’s phone number, email and how they found you."
            >
                <IconFactGrid
                    onAdd={onEdit}
                    facts={[
                        {
                            label: "Mobile",
                            icon: Phone,
                            value: formatPhoneIn(buyer.phoneDigits),
                        },
                        {
                            label: "Source",
                            icon: Tag,
                            value: source,
                            empty: !source,
                        },
                        {
                            label: "Email",
                            icon: Mail,
                            value: buyer.email,
                            wide: true,
                            empty: !buyer.email,
                        },
                    ]}
                />
            </DrawerSection>

            <DrawerSection
                title="Notes"
                description="Keep useful context for the next conversation."
                headingLevel={3}
            >
                <ContactNotes
                    key={buyer.id}
                    label="Client"
                    value={buyer.notes ?? buyer.details?.notes ?? ""}
                    onSave={(notes) => onQuickUpdate({ notes })}
                />
            </DrawerSection>
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

    const locality =
        details?.locality?.trim() ||
        owner.localities.filter((item) => item && item !== "—")[0] ||
        "";
    const source = sourceLabel(details?.source);
    const ownerType = ownerTypeLabel(details?.ownerType);
    const isPlatform = owner.origin === "platform";
    const fallback = contactLocationDefaults();
    const country = details?.country?.trim() || (isPlatform ? "" : fallback.country);
    const state = details?.state?.trim() || (isPlatform ? "" : fallback.state);
    const city = details?.city?.trim() || (isPlatform ? "" : fallback.city);
    const fullAddress = details?.fullAddress?.trim() || details?.address?.trim() || "";
    const reraNumber = details?.reraNumber?.trim() || "";

    const linkedProperties: ContactPropertyCardItem[] = owner.linkedListingId
        ? [
              {
                  id: owner.linkedListingId,
                  leadId: "",
                  title:
                      owner.linkedListingTitle || model.properties[0]?.title || "Private listing",
                  locality: locality || city,
                  priceLabel: model.askingPrice,
                  coverUrl: model.properties[0]?.coverUrl,
                  propertyType: model.propertyType,
              },
          ]
        : model.properties;

    return (
        <>
            <DrawerSection
                title="Owner and location"
                description="Review the owner type, location and address."
            >
                <IconFactGrid
                    onAdd={isPlatform || !canEditExclusiveOwners() ? undefined : onEdit}
                    facts={[
                        {
                            label: "Owner type",
                            icon: UserRound,
                            value: ownerType || "—",
                        },
                        {
                            label: "Country",
                            icon: Globe2,
                            value: country,
                        },
                        {
                            label: "State",
                            icon: MapPin,
                            value: state,
                        },
                        {
                            label: "City",
                            icon: Building2,
                            value: city,
                        },
                        {
                            label: "Area",
                            icon: MapPin,
                            value: locality || "—",
                        },
                        {
                            label: "Full address",
                            icon: Home,
                            value: fullAddress,
                            wide: true,
                            empty: !fullAddress,
                        },
                        // RERA fact temporarily hidden; preserve the original field.
                        ...(FEATURE_RERA_VERIFICATION
                            ? [
                                  {
                                      label: "RERA number",
                                      icon: Tag,
                                      value: reraNumber,
                                      empty: !reraNumber,
                                  },
                              ]
                            : []),
                    ]}
                />
            </DrawerSection>

            {onAttach || linkedProperties.length > 0 ? (
                <DetailSection title="Linked listing" onAdd={onAttach} sectionRef={propertiesRef}>
                    <AttachedPropertyRows properties={linkedProperties} onAttach={onAttach} />
                </DetailSection>
            ) : null}

            <DrawerSection
                title="Contact details"
                description="Find the owner’s phone number, email and source."
            >
                <IconFactGrid
                    onAdd={isPlatform || !canEditExclusiveOwners() ? undefined : onEdit}
                    facts={[
                        {
                            label: "Mobile",
                            icon: Phone,
                            value: owner.phoneDigits ? formatPhoneIn(owner.phoneDigits) : "",
                            empty: !owner.phoneDigits,
                        },
                        {
                            label: "Source",
                            icon: Tag,
                            value: source,
                            empty: !source,
                        },
                        {
                            label: "Email",
                            icon: Mail,
                            value: details?.email,
                            wide: true,
                            empty: !details?.email,
                        },
                    ]}
                />
            </DrawerSection>

            <DrawerSection
                title="Notes"
                description="Keep useful context for the next conversation."
                headingLevel={3}
            >
                <ContactNotes
                    key={owner.id}
                    label="Owner"
                    value={owner.notes ?? details?.notes ?? ""}
                    onSave={(notes) => onQuickUpdate({ notes })}
                    readOnlyMessage={
                        isPlatform
                            ? "Platform owner details are managed by the owner."
                            : !canEditExclusiveOwners()
                              ? "Owner notes are read-only until owner updates are available."
                              : undefined
                    }
                />
            </DrawerSection>
        </>
    );
}

export type ContactDetailPanelProps = {
    manageBrowserHistory?: boolean;
    contactType?: "buyer" | "owner";
    loadError?: string;
    onRetryLoad?: () => void;
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
    manageBrowserHistory = true,
    contactType = "buyer",
    loadError,
    onRetryLoad,
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

    useEffect(() => {
        if (open && initialSection === "properties")
            window.setTimeout(() => {
                const section = propertiesRef.current;
                if (section) {
                    revealDrawerSections(section);
                    section.scrollIntoView({ block: "start" });
                }
            }, 220);
    }, [initialSection, open]);

    if (!contact) {
        if (!open) return null;
        return (
            <AppModal
                manageBrowserHistory={manageBrowserHistory}
                open
                onOpenChange={onOpenChange}
                title={
                    loadError
                        ? `${contactType === "owner" ? "Owner" : "Client"} unavailable`
                        : `Loading ${contactType === "owner" ? "owner" : "client"}`
                }
                size="md"
                padding="md"
                nativeScroll
                className={cn("contacts-detail-drawer", styles.drawer, styles.preview)}
                headerClassName={styles.previewHeader}
                bodyClassName="flex flex-col gap-0"
            >
                {loadError ? (
                    <EmptyState
                        size="card"
                        icon={UserRound}
                        variant={onRetryLoad ? "error" : "default"}
                        heading={`${contactType === "owner" ? "Owner" : "Client"} unavailable`}
                        description={loadError}
                        action={
                            onRetryLoad
                                ? { label: "Try again", icon: RefreshCw, onClick: onRetryLoad }
                                : undefined
                        }
                    />
                ) : (
                    <ContactPanelSkeleton />
                )}
            </AppModal>
        );
    }
    const row = contact.row;
    const isBuyer = contact.type === "buyer";
    const edit = () =>
        isBuyer ? onEditBuyer(contact.row as BuyerRow) : onEditOwner(contact.row as OwnerRow);
    const badge =
        owner && FEATURE_PLATFORM_OWNER ? (
            owner.origin === "platform" ? (
                <span
                    className="
                      body-xs inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5
                      py-1 font-semibold tracking-wide text-brand-text
                    "
                >
                    Platform
                </span>
            ) : (
                <span
                    className="
                      body-xs inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5
                      py-1 font-semibold tracking-wide text-brand-text
                    "
                >
                    <span
                        aria-hidden
                        className="rounded-full bg-success-mid block-1.5 inline-1.5"
                    />
                    Added by you
                </span>
            )
        ) : null;
    const phone = row.phoneDigits;

    return (
        <AppModal
            manageBrowserHistory={manageBrowserHistory}
            open={open}
            onOpenChange={onOpenChange}
            title={isBuyer ? "Client details" : "Owner details"}
            size="md"
            padding="md"
            nativeScroll
            className={cn("contacts-detail-drawer", styles.drawer, styles.preview)}
            headerClassName={styles.previewHeader}
            header={
                <ContactSummary
                    name={formatPersonName(row.name)}
                    phone={phone}
                    avatarUrl={buyer?.avatarUrl ?? owner?.avatarUrl}
                    badge={badge}
                    onEdit={edit}
                    editLocked={owner?.origin === "platform"}
                    editAvailable={!owner || canEditExclusiveOwners()}
                />
            }
            footer={buyer || owner ? <ContactCallFooter phone={phone} name={row.name} /> : null}
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
