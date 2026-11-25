"use client";

import { parsePhoneNumberFromString } from "libphonenumber-js/max";

import { formatTelUrl, formatWhatsAppUrl } from "@/lib/format/phone";
import { formatBudgetAmount } from "@/lib/format/price";
import { cn } from "@/lib/utils";

import { CardLink } from "@/components/shared/card-link";
import { ContactName } from "@/components/shared/contact-name";
import { CallIcon, Link2, MapPin, WhatsAppIcon } from "@/components/shared/icons";
import { PropertyCoverImage } from "@/components/shared/property-cover-image";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { KINDS_WITHOUT_BHK, PROPERTY_KIND_OPTIONS } from "@/features/contacts/buyer-options";
import { ContactAreaChips } from "@/features/contacts/contact-area-chips";
import { ContactCardActions } from "@/features/contacts/contact-card-actions";
import type { BuyerRow } from "@/features/contacts/types";

function budgetRange(min: number | null | undefined, max: number | null | undefined) {
    const lower = min != null && Number.isFinite(min) ? min : null;
    const upper = max != null && Number.isFinite(max) ? max : null;
    if (lower != null && upper != null)
        return lower === upper
            ? formatBudgetAmount(lower)
            : `${formatBudgetAmount(lower)}–${formatBudgetAmount(upper)}`;
    if (upper != null) return `Up to ${formatBudgetAmount(upper)}`;
    if (lower != null) return `From ${formatBudgetAmount(lower)}`;
    return null;
}

export function BuyerCard({
    buyer,
    onOpen,
    onEdit,
    onAttachProperties,
    onOpenProperties,
    onDelete,
}: {
    buyer: BuyerRow;
    onOpen: (buyer: BuyerRow) => void;
    onEdit: (buyer: BuyerRow) => void;
    onAttachProperties: (buyer: BuyerRow) => void;
    onOpenProperties?: (buyer: BuyerRow) => void;
    onDelete?: (buyer: BuyerRow) => void;
    onViewLeads?: (buyer: BuyerRow) => void;
}) {
    const intent = buyer.hasRecordedIntent === false ? null : buyer.lookingFor;
    const kind =
        buyer.propertyKind !== "any"
            ? PROPERTY_KIND_OPTIONS.find((option) => option.value === buyer.propertyKind)?.label
            : null;
    const bhk =
        buyer.bhk != null && buyer.bhk > 0 && !KINDS_WITHOUT_BHK.includes(buyer.propertyKind)
            ? `${buyer.bhk} BHK`
            : null;
    const requirement = [bhk, kind].filter(Boolean).join(" · ");
    const saleBudget =
        intent !== "rent" ? budgetRange(buyer.budgetMinInr, buyer.budgetMaxInr) : null;
    const rentBudget =
        intent !== "buy" ? budgetRange(buyer.rentBudgetMinInr, buyer.rentBudgetMaxInr) : null;
    const areas = [
        ...new Set(buyer.preferredLocalities.map((area) => area.trim()).filter(Boolean)),
    ];
    const homeLocation = [buyer.city?.trim(), buyer.state?.trim()].filter(Boolean).join(", ");
    const linkedProperties = [
        ...new Map(buyer.attachedProperties.map((property) => [property.id, property])).values(),
    ];
    const propertyCount = linkedProperties.length;
    const canContact = Boolean(parsePhoneNumberFromString(buyer.phoneDigits, "IN")?.isValid());
    const open = () => onOpen(buyer);

    return (
        <div className="@container/contact-card flex flex-1 flex-col inline-full min-inline-0">
            <article
                data-linked-card
                className={cn(
                    "contact-card flex flex-1 cursor-pointer flex-col rounded-card border border-border-warm bg-surface p-3 shadow-md transition-[box-shadow,border-color] duration-160 min-inline-0 hover:shadow-lg @[17rem]/contact-card:p-4 @[22rem]/contact-card:p-5",
                    (saleBudget || rentBudget) && "md:min-block-96",
                )}
            >
                <CardLink
                    href={`/broker/contacts?tab=buyers&contact=${encodeURIComponent(buyer.id)}`}
                    label={`Open ${buyer.name}`}
                    onOpen={open}
                />
                <div className="mbe-3 flex items-center justify-between gap-2">
                    {intent ? (
                        <Badge
                            className="wrap-anywhere whitespace-normal min-inline-0"
                            color={
                                intent === "rent"
                                    ? "orange"
                                    : intent === "both"
                                      ? "purple"
                                      : "emerald"
                            }
                        >
                            {
                                {
                                    buy: "Buying",
                                    rent: "Renting",
                                    both: "Buying or renting",
                                }[intent]
                            }
                        </Badge>
                    ) : (
                        <span />
                    )}
                    <ContactCardActions
                        name={buyer.name}
                        onOpen={open}
                        onEdit={() => onEdit(buyer)}
                        onDelete={onDelete ? () => onDelete(buyer) : undefined}
                        density="menu"
                    />
                </div>
                <header>
                    <div className="flex items-center gap-2 min-inline-0 @[20rem]/contact-card:gap-3">
                        <UserAvatar
                            name={buyer.name}
                            imageUrl={buyer.avatarUrl}
                            size="card"
                            framed={false}
                            className="shrink-0 border-2 border-white shadow-sm"
                        />
                        <div className="flex-1 min-inline-0">
                            <h2 className="body font-semibold text-ink">
                                <ContactName
                                    name={buyer.name}
                                    contactId={buyer.id}
                                    contactType="buyer"
                                    onOpen={open}
                                    data-card-title
                                    data-contact-id={buyer.id}
                                    className="block truncate max-inline-full"
                                />
                            </h2>
                            {homeLocation ? (
                                <p className="body-sm mbs-1 flex items-start gap-1 text-ink-muted">
                                    <MapPin
                                        aria-hidden
                                        className="mbs-0.5 shrink-0 block-3.5 inline-3.5"
                                    />
                                    <span className="wrap-anywhere min-inline-0">
                                        {homeLocation}
                                    </span>
                                </p>
                            ) : null}
                        </div>
                    </div>
                </header>
                <div className="flex flex-1 flex-col gap-4 py-4 min-inline-0 @[20rem]/contact-card:py-5">
                    {areas.length > 0 ? (
                        <dl>
                            <div className="flex flex-col gap-1">
                                <dt className="body-xs font-semibold text-ink-muted">
                                    Preferred locations
                                </dt>
                                <dd className="mbs-1 min-inline-0">
                                    <ContactAreaChips
                                        areas={areas}
                                        onEditAreas={() => onEdit(buyer)}
                                        editLabel="Add or edit preferred areas"
                                    />
                                </dd>
                            </div>
                        </dl>
                    ) : null}
                    {requirement ? (
                        <p className="body-sm font-medium text-ink">{requirement}</p>
                    ) : null}
                    {saleBudget || rentBudget ? (
                        <dl
                            className={cn(
                                "relative grid gap-4 min-inline-0 @[25rem]/contact-card:gap-8",
                                saleBudget && rentBudget
                                    ? "grid-cols-1 @[20rem]/contact-card:grid-cols-2 @[20rem]/contact-card:after:pointer-events-none @[20rem]/contact-card:after:absolute @[20rem]/contact-card:after:inset-y-0 @[20rem]/contact-card:after:inset-s-1/2 @[20rem]/contact-card:after:bg-border-warm @[20rem]/contact-card:after:inline-px"
                                    : "grid-cols-1",
                            )}
                        >
                            {saleBudget ? (
                                <div className="flex flex-col gap-1">
                                    <dt className="body-xs font-semibold text-ink-muted">
                                        Sale budget
                                    </dt>
                                    <dd className="body tabular font-bold wrap-break-word text-brand-text">
                                        {saleBudget}
                                    </dd>
                                </div>
                            ) : null}
                            {rentBudget ? (
                                <div className="flex flex-col gap-1">
                                    <dt className="body-xs font-semibold text-ink-muted">
                                        Monthly rent budget
                                    </dt>
                                    <dd className="body tabular font-bold wrap-break-word text-brand-text">
                                        {rentBudget}
                                    </dd>
                                </div>
                            ) : null}
                        </dl>
                    ) : null}
                </div>
                <footer className="mbs-auto flex flex-col gap-3 border-bs border-border-warm pbs-3">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 min-block-11">
                        <Button
                            variant="outline"
                            type="button"
                            aria-label={
                                propertyCount
                                    ? `View ${propertyCount} linked properties for ${buyer.name}`
                                    : `Link a property to ${buyer.name}`
                            }
                            onClick={(event) => {
                                event.stopPropagation();
                                if (propertyCount) (onOpenProperties ?? onOpen)(buyer);
                                else onAttachProperties(buyer);
                            }}
                            className="flex-wrap gap-2 border-dashed border-brand/40 p-2 font-semibold whitespace-normal text-brand-text shadow-none block-auto inline-full min-block-11 min-inline-0 hover:border-brand hover:bg-brand-soft/30 hover:text-brand-text @[20rem]/contact-card:px-4"
                        >
                            {propertyCount > 0 ? (
                                <span className="body-sm font-semibold text-ink-muted">
                                    Properties
                                </span>
                            ) : null}
                            {propertyCount > 0 ? (
                                <span className="flex items-center -space-x-2" aria-hidden>
                                    {linkedProperties.slice(0, 3).map((property) => (
                                        <PropertyCoverImage
                                            key={property.id}
                                            src={property.coverUrl}
                                            alt=""
                                            sizes="24px"
                                            size={24}
                                        />
                                    ))}
                                </span>
                            ) : (
                                <Link2 aria-hidden />
                            )}
                            <span>
                                {propertyCount ? `${propertyCount} linked` : "Attach property"}
                            </span>
                        </Button>
                    </div>
                    {canContact ? (
                        <div
                            className="grid grid-cols-1 gap-2 @[16rem]/contact-card:grid-cols-2"
                            onClick={(event) => event.stopPropagation()}
                        >
                            <Button
                                size="md"
                                variant="outline"
                                className="px-2 font-semibold inline-full min-block-11 min-inline-0 @[20rem]/contact-card:px-4"
                                nativeButton={false}
                                render={
                                    <a
                                        href={formatTelUrl(buyer.phoneDigits)}
                                        aria-label={`Call ${buyer.name}`}
                                    />
                                }
                            >
                                <CallIcon aria-hidden /> Call
                            </Button>
                            <Button
                                size="md"
                                variant="accent"
                                className="px-2 font-semibold inline-full min-block-11 min-inline-0 @[20rem]/contact-card:px-4"
                                nativeButton={false}
                                render={
                                    <a
                                        href={formatWhatsAppUrl(buyer.phoneDigits)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={`Message ${buyer.name} on WhatsApp`}
                                    />
                                }
                            >
                                <WhatsAppIcon aria-hidden /> WhatsApp
                            </Button>
                        </div>
                    ) : null}
                </footer>
            </article>
        </div>
    );
}
