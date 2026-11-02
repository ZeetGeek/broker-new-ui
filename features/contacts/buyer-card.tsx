"use client";

import { parsePhoneNumberFromString } from "libphonenumber-js/max";

import { formatTelUrl, formatWhatsAppUrl } from "@/lib/format/phone";
import { formatBudgetAmount } from "@/lib/format/price";
import { cn } from "@/lib/utils";

import { CallIcon, Link2, MapPin, WhatsAppIcon } from "@/components/shared/icons";
import { PropertyThumb } from "@/components/shared/property-thumb";
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
        <article
            onClick={open}
            className="contact-card flex cursor-pointer flex-col rounded-card border border-border-warm bg-surface p-5 shadow-md transition-[box-shadow,border-color] duration-160 block-full min-block-96 hover:shadow-lg"
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
                    <UserAvatar
                        name={buyer.name}
                        imageUrl={buyer.avatarUrl}
                        size="md"
                        framed={false}
                        className="border-2 border-white shadow-sm"
                    />
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
                    <dl
                        className={cn(
                            "relative grid gap-8",
                            saleBudget && rentBudget
                                ? "grid-cols-2 after:pointer-events-none after:absolute after:inset-y-0 after:inset-s-1/2 after:bg-border-warm after:inline-px"
                                : "grid-cols-1",
                        )}
                    >
                        {saleBudget ? (
                            <div className="flex flex-col gap-1">
                                <dt className="body-xs font-medium text-ink-muted">Sale budget</dt>
                                <dd className="body tabular font-bold wrap-break-word text-brand-text">
                                    {saleBudget}
                                </dd>
                            </div>
                        ) : null}
                        {rentBudget ? (
                            <div className="flex flex-col gap-1">
                                <dt className="body-xs font-medium text-ink-muted">
                                    Monthly rent budget
                                </dt>
                                <dd className="body tabular font-bold wrap-break-word text-brand-text">
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
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 min-block-11">
                    {propertyCount > 0 ? (
                        <span className="body-sm text-ink-muted">Properties</span>
                    ) : null}
                    <Button
                        variant="link"
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
                        className="gap-2 px-0 text-brand-text min-block-11"
                    >
                        {propertyCount > 0 ? (
                            <span className="flex items-center -space-x-2" aria-hidden>
                                {linkedProperties.slice(0, 3).map((property) => (
                                    <PropertyThumb
                                        key={property.id}
                                        src={property.coverUrl}
                                        alt=""
                                        hoverScale={false}
                                        sizes="28px"
                                        sizeClassName="block-7 inline-7"
                                        iconClassName="block-3.5 inline-3.5"
                                        className="rounded-full ring-2 ring-surface"
                                    />
                                ))}
                            </span>
                        ) : (
                            <Link2 aria-hidden />
                        )}
                        <span>{propertyCount ? `${propertyCount} linked` : "Link a property"}</span>
                    </Button>
                </div>
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
