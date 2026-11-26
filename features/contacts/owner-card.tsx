"use client";

import { canEditExclusiveOwners } from "@/lib/api/exclusive-owners";
import { formatWhatsAppUrl } from "@/lib/format/phone";

import { CardLink } from "@/components/shared/card-link";
import { ContactName } from "@/components/shared/contact-name";
import { CallIcon, Link2, MapPin, WhatsAppIcon } from "@/components/shared/icons";
import { PropertyCoverImage } from "@/components/shared/property-cover-image";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { ContactAreaChips } from "@/features/contacts/contact-area-chips";
import { ContactCardActions } from "@/features/contacts/contact-card-actions";
import type { OwnerRow } from "@/features/contacts/types";

export function OwnerCard({
    owner,
    onOpen,
    onEdit,
    onAttachProperty,
    onOpenProperties,
    onDelete,
}: {
    owner: OwnerRow;
    onOpen: (owner: OwnerRow) => void;
    onEdit?: (owner: OwnerRow) => void;
    onAttachProperty?: (owner: OwnerRow) => void;
    onOpenProperties?: (owner: OwnerRow) => void;
    onDelete?: (owner: OwnerRow) => void;
}) {
    const isPlatform = owner.origin === "platform";
    const canContact =
        (!isPlatform || owner.hasActiveRepresentation) &&
        /^[6-9]\d{9}$/.test(owner.phoneDigits ?? "");
    const open = () => onOpen(owner);
    const attach = !isPlatform && onAttachProperty ? () => onAttachProperty(owner) : undefined;
    const properties = [
        ...new Map((owner.properties ?? []).map((property) => [property.id, property])).values(),
    ];
    const propertyCount = Math.max(owner.propertyCount, properties.length);
    const city = owner.details?.city?.trim();
    const homeLocation = [city, owner.details?.state?.trim()].filter(Boolean).join(", ");
    const areas = [
        ...new Set(
            [owner.details?.locality, ...owner.localities]
                .map((area) => area?.trim())
                .filter((area): area is string => Boolean(area && area !== city && area !== "—")),
        ),
    ];
    const ownerType = owner.details?.ownerType;
    const ownerLabel =
        ownerType === "individual"
            ? "Individual owner"
            : ownerType === "builder"
              ? "Builder"
              : ownerType === "company"
                ? "Company owner"
                : "Property owner";

    return (
        <div className="@container/contact-card flex flex-1 flex-col inline-full min-inline-0">
            <article
                data-linked-card
                className="contact-card flex flex-1 cursor-pointer flex-col rounded-card border border-border-warm bg-surface p-3 shadow-md transition-[box-shadow,border-color] duration-160 min-inline-0 hover:shadow-lg @[17rem]/contact-card:p-4 @[22rem]/contact-card:p-5"
            >
                <CardLink
                    href={`/broker/contacts?tab=owners&contact=${encodeURIComponent(owner.id)}`}
                    label={`Open ${owner.name}`}
                    onOpen={open}
                />
                <div className="mbe-3 flex items-center justify-between gap-2">
                    <Badge color="emerald" className="wrap-anywhere whitespace-normal min-inline-0">
                        {ownerLabel}
                    </Badge>
                    <ContactCardActions
                        editLabel="Edit owner"
                        name={owner.name}
                        onOpen={open}
                        onEdit={
                            !isPlatform && canEditExclusiveOwners() && onEdit
                                ? () => onEdit(owner)
                                : undefined
                        }
                        onDelete={!isPlatform && onDelete ? () => onDelete(owner) : undefined}
                        editLocked={isPlatform}
                        density="menu"
                    />
                </div>
                <header className="flex items-center gap-2 min-inline-0 @[20rem]/contact-card:gap-3">
                    <UserAvatar
                        name={owner.name}
                        imageUrl={owner.avatarUrl}
                        size="card"
                        framed={false}
                        className="shrink-0 border-2 border-white shadow-sm"
                    />
                    <div className="flex-1 min-inline-0">
                        <h2 className="body font-semibold text-ink">
                            <ContactName
                                name={owner.name}
                                contactId={owner.id}
                                contactType="owner"
                                onOpen={open}
                                data-card-title
                                data-contact-id={owner.id}
                                className="block truncate max-inline-full"
                            />
                        </h2>
                        {homeLocation ? (
                            <p className="body-sm mbs-1 flex items-start gap-1 text-ink-muted">
                                <MapPin
                                    aria-hidden
                                    className="mbs-0.5 shrink-0 block-3.5 inline-3.5"
                                />
                                <span className="wrap-anywhere min-inline-0">{homeLocation}</span>
                            </p>
                        ) : null}
                    </div>
                </header>
                <div className="flex flex-col gap-4 py-4 min-inline-0 @[20rem]/contact-card:pbs-5 @[20rem]/contact-card:pbe-6">
                    {areas.length > 0 ? (
                        <dl>
                            <div className="flex flex-col gap-1">
                                <dt className="body-xs font-semibold text-ink-muted">
                                    Property locations
                                </dt>
                                <dd className="mbs-1 min-inline-0">
                                    <ContactAreaChips
                                        areas={areas}
                                        onEditAreas={
                                            !isPlatform && canEditExclusiveOwners() && onEdit
                                                ? () => onEdit(owner)
                                                : undefined
                                        }
                                        editLabel="Edit owner area"
                                    />
                                </dd>
                            </div>
                        </dl>
                    ) : null}
                </div>
                <footer className="mbs-auto flex flex-col gap-3 border-bs border-border-warm pbs-3">
                    {propertyCount > 0 || attach ? (
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 min-block-11">
                            <Button
                                variant="outline"
                                type="button"
                                aria-label={
                                    attach
                                        ? `Attach a property to ${owner.name}`
                                        : `View ${propertyCount} linked properties for ${owner.name}`
                                }
                                onClick={(event) => {
                                    event.stopPropagation();
                                    if (attach) attach();
                                    else (onOpenProperties ?? onOpen)(owner);
                                }}
                                className="flex-wrap gap-2 border-dashed border-brand/40 p-2 font-semibold whitespace-normal text-brand-text shadow-none block-auto inline-full min-block-11 min-inline-0 hover:border-brand hover:bg-brand-soft/30 hover:text-brand-text @[20rem]/contact-card:px-4"
                            >
                                {propertyCount > 0 ? (
                                    <span className="body-sm font-semibold text-ink-muted">
                                        Properties
                                    </span>
                                ) : null}
                                {properties.length > 0 ? (
                                    <span className="flex items-center -space-x-2" aria-hidden>
                                        {properties.slice(0, 3).map((property) => (
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
                    ) : null}
                    {canContact && owner.phoneDigits ? (
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
                                        href={`tel:+91${owner.phoneDigits}`}
                                        aria-label={`Call ${owner.name}`}
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
                                        href={formatWhatsAppUrl(owner.phoneDigits)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={`Message ${owner.name} on WhatsApp`}
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
