"use client";

import { BadgeCheck, Building2, MapPin, Plus } from "lucide-react";

import { calendarDaysBetween, formatRelativePast } from "@/lib/format/date";
import { formatPhoneIn } from "@/lib/format/phone";
import { brokerPropertyDetailHref } from "@/lib/routes/broker";
import { cn } from "@/lib/utils";

import { AppImage } from "@/components/shared/app-image";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";

import { toOwnerContactCardModel } from "@/features/contacts/contact-card-model";
import { ContactCardActions } from "@/features/contacts/contact-card-actions";
import { PropertyCoverStack } from "@/features/contacts/property-cover-stack";
import type { OwnerRow } from "@/features/contacts/types";

function ownerFallbackColor(id: string) {
    let hash = 0;
    for (const character of id) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
    return `hsl(${34 + (hash % 112)} 42% 76%)`;
}

function statusLabel(status: string) {
    return status.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function OwnerRecency({ value }: { value?: string | null }) {
    if (!value) {
        return (
            <span className="flex items-center gap-2 text-ink-muted">
                <span
                    className="rounded-full border border-ink-subtle block-2 inline-2"
                    aria-hidden
                />
                Not contacted yet
            </span>
        );
    }
    const date = new Date(value);
    const days = calendarDaysBetween(date, new Date());
    return (
        <span className="flex items-center gap-2 text-ink-muted">
            <span
                className={cn(
                    "rounded-full block-2 inline-2",
                    days <= 3 && "bg-success",
                    days > 3 && days <= 14 && "bg-pending",
                    days > 14 && "bg-ink-subtle",
                )}
                aria-hidden
            />
            Spoke {formatRelativePast(date, new Date())}
        </span>
    );
}

export function OwnerCard({
    owner,
    onOpen,
    onEdit,
    onAttachProperty,
    onOpenProperties,
}: {
    owner: OwnerRow;
    onOpen: (owner: OwnerRow) => void;
    onEdit?: (owner: OwnerRow) => void;
    onAttachProperty?: (owner: OwnerRow) => void;
    onOpenProperties?: (owner: OwnerRow) => void;
}) {
    const model = toOwnerContactCardModel(owner);
    const isPlatform = owner.origin === "platform";
    const canContact = (!isPlatform || owner.hasActiveRepresentation) && Boolean(owner.phoneDigits);
    const onlyProperty = model.properties.length === 1 ? model.properties[0] : null;
    const open = () => onOpen(owner);
    const attach = !isPlatform && onAttachProperty ? () => onAttachProperty(owner) : undefined;

    return (
        <article
            role="button"
            data-contact-id={owner.id}
            tabIndex={0}
            aria-label={`Open ${owner.name}`}
            onClick={open}
            onKeyDown={(event) => {
                if (event.key === "Enter") open();
            }}
            className="
              contact-card group/card flex cursor-pointer flex-col rounded-card border
              border-border-warm bg-surface p-4 outline-none min-block-[356px]
              focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-brand/20
            "
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-inline-0">
                    <UserAvatar
                        name={owner.name}
                        size="md"
                        fallback="character"
                        className="shrink-0 rounded-[12px]"
                    />
                    <div className="min-inline-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                            <h2 className="body-sm truncate font-bold text-ink">{owner.name}</h2>
                            {isPlatform ? (
                                <Badge variant="brand" className="gap-1">
                                    <BadgeCheck aria-hidden /> Platform
                                </Badge>
                            ) : (
                                <Badge variant="outline">Added by you</Badge>
                            )}
                        </div>
                        {canContact && owner.phoneDigits ? (
                            <a
                                href={`tel:+91${owner.phoneDigits}`}
                                onClick={(event) => event.stopPropagation()}
                                className="body-xs tabular text-ink-muted hover:text-brand-text hover:underline"
                            >
                                {formatPhoneIn(owner.phoneDigits)}
                            </a>
                        ) : (
                            <span className="body-xs text-ink-muted">Number hidden</span>
                        )}
                    </div>
                </div>

                <ContactCardActions
                    name={owner.name}
                    phoneDigits={canContact ? owner.phoneDigits : undefined}
                    onOpen={open}
                    onEdit={onEdit ? () => onEdit(owner) : undefined}
                    onAttach={attach}
                    onNotes={open}
                    editLocked={isPlatform}
                />
            </div>

            <div className="mbs-4 flex flex-wrap items-center gap-1.5">
                <Badge
                    variant="brand"
                    className={cn(
                        "capitalize",
                        model.intent !== "sell" &&
                            "border-pending/20 bg-urgent-soft/65 text-pending",
                    )}
                >
                    {model.intent}
                </Badge>
                <Badge variant="outline" className="text-ink">
                    {model.propertyType}
                </Badge>
                {model.configuration ? (
                    <Badge variant="outline" className="text-ink">
                        {model.configuration}
                    </Badge>
                ) : null}
                <Badge variant="neutral" className="tabular font-bold text-ink">
                    {model.askingPrice}
                </Badge>
            </div>

            <p className="body-xs mbs-3 flex items-center gap-1.5 text-ink-muted min-block-5">
                <MapPin aria-hidden className="shrink-0 block-3.5 inline-3.5" strokeWidth={1.75} />
                <span className="truncate">
                    {model.localities.slice(0, 2).join(", ") || "Surat"}
                </span>
            </p>

            <div className="mbs-3 flex flex-1 items-start">
                {onlyProperty ? (
                    <button
                        type="button"
                        aria-label={`Open ${onlyProperty.title}`}
                        onClick={(event) => {
                            event.stopPropagation();
                            window.location.assign(brokerPropertyDetailHref(onlyProperty.id));
                        }}
                        className="
                          group/cover relative aspect-video overflow-hidden rounded-inner
                          bg-surface-muted text-start outline-none inline-full
                          focus-visible:ring-3 focus-visible:ring-brand/30
                        "
                        style={{ backgroundColor: ownerFallbackColor(onlyProperty.id) }}
                    >
                        <Building2
                            aria-hidden
                            className="absolute inset-s-1/2 inset-bs-1/2 -translate-1/2 text-brand-ink/55 block-9 inline-9"
                            strokeWidth={1.25}
                        />
                        {onlyProperty.coverUrl ? (
                            <AppImage
                                src={onlyProperty.coverUrl}
                                alt=""
                                fill
                                quality={70}
                                sizes="(max-width: 640px) 100vw, 33vw"
                                className="transition-transform duration-160 group-hover/cover:scale-[1.015]"
                            />
                        ) : null}
                        <span className="absolute inset-x-0 inset-be-0 bg-gradient-to-t from-brand-ink/85 to-transparent px-3 pbs-8 pbe-2.5 text-surface">
                            <span className="body-xs block truncate font-semibold">
                                {onlyProperty.title}
                            </span>
                            <span className="block text-[11px] text-surface/75">
                                {onlyProperty.locality}
                            </span>
                        </span>
                    </button>
                ) : model.properties.length > 1 ? (
                    <PropertyCoverStack
                        properties={model.properties}
                        onAttach={attach}
                        onOpenOverflow={() => (onOpenProperties ? onOpenProperties(owner) : open())}
                    />
                ) : attach ? (
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            attach();
                        }}
                        className="body-xs flex items-center justify-center gap-2 rounded-inner border border-dashed border-brand/35 bg-brand-soft/25 font-semibold text-brand-text block-20 inline-full hover:bg-brand-soft/60"
                    >
                        <Plus aria-hidden className="block-4 inline-4" /> Attach property
                    </button>
                ) : null}
            </div>

            <footer className="body-xs mbs-3 flex flex-wrap items-center justify-between gap-2 border-bs border-border-warm pbs-3 min-block-8">
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                        {statusLabel(model.status)}
                    </Badge>
                    <OwnerRecency value={owner.lastSpokeAt} />
                </div>
            </footer>
        </article>
    );
}
