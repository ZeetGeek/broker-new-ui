"use client";

import { formatWhatsAppUrl } from "@/lib/format/phone";
import { formatPrice } from "@/lib/format/price";

import { CallIcon, ChevronRight, Link2, MapPin, WhatsAppIcon } from "@/components/shared/icons";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { KINDS_WITHOUT_BHK, PROPERTY_KIND_OPTIONS } from "@/features/contacts/buyer-options";
import { ContactCardActions } from "@/features/contacts/contact-card-actions";
import type { BuyerRow } from "@/features/contacts/types";

function budgetRange(min: number | null | undefined, max: number | null | undefined) {
    const lower = min != null && Number.isFinite(min) ? min : null;
    const upper = max != null && Number.isFinite(max) ? max : null;
    if (lower != null && upper != null)
        return lower === upper
            ? formatPrice(lower)
            : `${formatPrice(lower)} – ${formatPrice(upper)}`;
    if (upper != null) return `Up to ${formatPrice(upper)}`;
    if (lower != null) return `From ${formatPrice(lower)}`;
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
    const propertyCount = new Set(buyer.attachedProperties.map((property) => property.id)).size;
    const canContact = /^[6-9]\d{9}$/.test(buyer.phoneDigits);
    const open = () => onOpen(buyer);

    return (
        <article
            onClick={open}
            className="contact-card flex cursor-pointer flex-col rounded-card border border-border-warm bg-surface p-5 shadow-md transition-[box-shadow,border-color] duration-160 block-full hover:shadow-lg"
        >
            <div className="mbe-3 flex items-center justify-between gap-2">
                {intent ? (
                    <Badge
                        color={
                            intent === "rent" ? "orange" : intent === "both" ? "purple" : "emerald"
                        }
                    >
                        {
                            {
                                buy: "Looking to buy property",
                                rent: "Looking to rent property",
                                both: "Open to buying or renting",
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
                <div className="flex items-center gap-3 min-inline-0">
                    <UserAvatar name={buyer.name} imageUrl={buyer.avatarUrl} size="md" />
                    <div className="min-inline-0">
                        <h2 className="body font-semibold text-ink">
                            <button
                                type="button"
                                data-contact-id={buyer.id}
                                aria-label={`Open ${buyer.name}`}
                                onClick={(event) => {
                                    event.stopPropagation();
                                    open();
                                }}
                                className="relative rounded-sm text-start wrap-break-word outline-none after:absolute after:inset-x-0 after:inset-y-[-10px] hover:text-brand-text focus-visible:ring-3 focus-visible:ring-ring/30"
                            >
                                {buyer.name}
                            </button>
                        </h2>
                        {homeLocation ? (
                            <p className="body-sm mbs-1 flex items-start gap-1 text-ink-muted">
                                <MapPin
                                    aria-hidden
                                    className="mbs-0.5 shrink-0 block-3.5 inline-3.5"
                                />
                                <span className="wrap-break-word min-inline-0">{homeLocation}</span>
                            </p>
                        ) : null}
                    </div>
                </div>
            </header>
            <div className="flex flex-1 flex-col gap-3 py-5 min-inline-0">
                {requirement ? <p className="body-sm font-medium text-ink">{requirement}</p> : null}
                {saleBudget || rentBudget ? (
                    <dl className="grid grid-cols-2 gap-4 divide-x divide-border-warm [&>div+div]:ps-4">
                        {saleBudget ? (
                            <div className="flex flex-col gap-1">
                                <dt className="body-xs font-medium text-ink-muted">Sale budget</dt>
                                <dd className="body tabular font-semibold wrap-break-word text-brand-text">
                                    {saleBudget}
                                </dd>
                            </div>
                        ) : null}
                        {rentBudget ? (
                            <div className="flex flex-col gap-1">
                                <dt className="body-xs font-medium text-ink-muted">
                                    Monthly rent budget
                                </dt>
                                <dd className="body tabular font-semibold wrap-break-word text-brand-text">
                                    {rentBudget}
                                </dd>
                            </div>
                        ) : null}
                    </dl>
                ) : null}
                {areas.length > 0 ? (
                    <dl>
                        <div className="flex flex-col gap-1">
                            <dt className="body-xs font-medium text-ink-muted">
                                Preferred locations
                            </dt>
                            <dd className="body-sm wrap-break-word text-ink">{areas.join(", ")}</dd>
                        </div>
                    </dl>
                ) : null}
            </div>
            <footer className="mbs-auto flex flex-col gap-3 border-bs border-border-warm pbs-3">
                <button
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation();
                        if (propertyCount) (onOpenProperties ?? onOpen)(buyer);
                        else onAttachProperties(buyer);
                    }}
                    className="body-sm flex items-center gap-2 rounded-control text-start font-semibold text-brand-text outline-none min-block-11 hover:bg-surface-muted focus-visible:ring-3 focus-visible:ring-ring/30"
                >
                    <Link2 aria-hidden className="shrink-0 block-4 inline-4" />
                    <span className="flex-1">
                        {propertyCount
                            ? `${propertyCount} ${propertyCount === 1 ? "property" : "properties"} linked`
                            : "Link a property"}
                    </span>
                    <ChevronRight aria-hidden className="shrink-0 block-4 inline-4" />
                </button>
                {canContact ? (
                    <div
                        className="grid grid-cols-2 gap-2"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <Button
                            size="md"
                            variant="outline"
                            className="inline-full min-block-11"
                            nativeButton={false}
                            render={
                                <a
                                    href={`tel:+91${buyer.phoneDigits}`}
                                    aria-label={`Call ${buyer.name}`}
                                />
                            }
                        >
                            <CallIcon aria-hidden /> Call
                        </Button>
                        <Button
                            size="md"
                            variant="secondary"
                            className="inline-full min-block-11"
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
    );
}
