"use client";

import { formatWhatsAppUrl } from "@/lib/format/phone";

import { CallIcon, Link2, MapPin, WhatsAppIcon } from "@/components/shared/icons";
import { PropertyThumb } from "@/components/shared/property-thumb";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
        <article
            onClick={open}
            className="contact-card flex cursor-pointer flex-col rounded-card border border-border-warm bg-surface p-5 shadow-md transition-[box-shadow,border-color] duration-160 block-full min-block-80 hover:shadow-lg"
        >
            <div className="mbe-3 flex items-center justify-between gap-2">
                <Badge color="emerald">{ownerLabel}</Badge>
                <ContactCardActions
                    editLabel="Edit owner"
                    name={owner.name}
                    onOpen={open}
                    onEdit={!isPlatform && onEdit ? () => onEdit(owner) : undefined}
                    onDelete={!isPlatform && onDelete ? () => onDelete(owner) : undefined}
                    editLocked={isPlatform}
                    density="menu"
                />
            </div>
            <header className="flex items-center gap-3 min-inline-0">
                <UserAvatar
                    name={owner.name}
                    imageUrl={owner.avatarUrl}
                    size="md"
                    framed={false}
                    className="border-2 border-white shadow-sm"
                />
                <div className="min-inline-0">
                    <h2 className="body font-semibold text-ink">
                        <button
                            type="button"
                            data-contact-id={owner.id}
                            aria-label={`Open ${owner.name}`}
                            onClick={(event) => {
                                event.stopPropagation();
                                open();
                            }}
                            className="relative rounded-sm text-start wrap-break-word outline-none after:absolute after:inset-x-0 after:inset-y-[-10px] hover:text-brand-text focus-visible:ring-3 focus-visible:ring-ring/30"
                        >
                            {owner.name}
                        </button>
                    </h2>
                    {homeLocation ? (
                        <p className="body-sm mbs-1 flex items-start gap-1 text-ink-muted">
                            <MapPin aria-hidden className="mbs-0.5 shrink-0 block-3.5 inline-3.5" />
                            <span className="wrap-break-word min-inline-0">{homeLocation}</span>
                        </p>
                    ) : null}
                </div>
            </header>
            <div className="flex flex-1 flex-col gap-3 py-5 min-inline-0">
                {areas.length > 0 ? (
                    <dl>
                        <div className="flex flex-col gap-1">
                            <dt className="body-xs font-medium text-ink-muted">
                                Property locations
                            </dt>
                            <dd className="body-sm wrap-break-word text-ink">{areas.join(", ")}</dd>
                        </div>
                    </dl>
                ) : null}
            </div>
            <footer className="mbs-auto flex flex-col gap-3 border-bs border-border-warm pbs-3">
                {propertyCount > 0 || attach ? (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 min-block-11">
                        {propertyCount > 0 ? (
                            <span className="body-sm text-ink-muted">Properties</span>
                        ) : null}
                        <Button
                            variant="link"
                            type="button"
                            aria-label={
                                propertyCount
                                    ? `View ${propertyCount} linked properties for ${owner.name}`
                                    : `Link a property to ${owner.name}`
                            }
                            onClick={(event) => {
                                event.stopPropagation();
                                if (propertyCount) (onOpenProperties ?? onOpen)(owner);
                                else attach?.();
                            }}
                            className="gap-2 px-0 text-brand-text min-block-11"
                        >
                            {properties.length > 0 ? (
                                <span className="flex items-center -space-x-2" aria-hidden>
                                    {properties.slice(0, 3).map((property) => (
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
                            <span>
                                {propertyCount ? `${propertyCount} linked` : "Link a property"}
                            </span>
                        </Button>
                    </div>
                ) : null}
                {canContact && owner.phoneDigits ? (
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
                            className="inline-full min-block-11"
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
    );
}
