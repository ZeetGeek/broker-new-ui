"use client";

import { addCollection, Icon } from "@iconify/react/offline";
import { BadgeCheck, MapPin, Phone, UserPlus } from "lucide-react";

import { formatRelativePast } from "@/lib/format/date";
import { formatPhoneIn, formatWhatsAppUrl } from "@/lib/format/phone";
import { cn } from "@/lib/utils";

import { OVERLAY_GLASS_BUTTON_CLASS } from "@/components/shared/overlay-card";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";

import { AttachedPropertiesRow } from "@/features/contacts/attached-properties-row";
import { toOwnerContactCardModel } from "@/features/contacts/contact-card-model";
import { ContactCardActions } from "@/features/contacts/contact-card-actions";
import type { OwnerRow } from "@/features/contacts/types";
import whatsappIcons from "@/features/properties/my-requests/bi-whatsapp.json";

addCollection(whatsappIcons as Parameters<typeof addCollection>[0]);

function statusLabel(status: string) {
    return status.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/** Same pill language as pipeline deal cards (soft fill + leading status dot). */
function OriginPill({ origin }: { origin: "platform" | "custom" }) {
    if (origin === "platform") {
        return (
            <span
                className="
                  body-xs inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1
                  font-semibold tracking-wide text-brand-text
                "
            >
                <BadgeCheck aria-hidden className="block-3 inline-3" strokeWidth={2} />
                Platform
            </span>
        );
    }

    return (
        <span
            className="
              body-xs inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1
              font-semibold tracking-wide text-brand-text
            "
        >
            <span aria-hidden className="rounded-full bg-success-mid block-1.5 inline-1.5" />
            Added by you
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
    const open = () => onOpen(owner);
    const attach = !isPlatform && onAttachProperty ? () => onAttachProperty(owner) : undefined;
    const propertyCount = model.properties.length;
    const locality = model.localities.slice(0, 2).join(", ") || null;
    const intentLabel =
        model.intent === "rent" || model.intent === "lease"
            ? "Renting out"
            : model.intent === "sell" || model.intent === "sale"
              ? "Selling"
              : model.intent;
    const needLine = [intentLabel, model.configuration, model.propertyType, locality]
        .filter(Boolean)
        .join(" · ");
    const spokeLabel = owner.lastSpokeAt
        ? `Spoke ${formatRelativePast(new Date(owner.lastSpokeAt), new Date())}`
        : "Not contacted yet";

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
              contact-card group/card relative flex h-full cursor-pointer flex-col gap-3
              rounded-card border border-border-warm bg-surface p-4 outline-none shadow-md
              transition-[box-shadow] duration-160 hover:shadow-lg
              focus-visible:ring-3 focus-visible:ring-brand/20
            "
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5 min-inline-0">
                    <OriginPill origin={owner.origin} />
                    <span className="body-xs capitalize text-ink-muted">
                        {statusLabel(model.status)}
                    </span>
                </div>
                <div onClick={(event) => event.stopPropagation()}>
                    <ContactCardActions
                        name={owner.name}
                        phoneDigits={canContact ? owner.phoneDigits : undefined}
                        onOpen={open}
                        onEdit={onEdit ? () => onEdit(owner) : undefined}
                        onAttach={attach}
                        onNotes={open}
                        editLocked={isPlatform}
                        density="menu"
                    />
                </div>
            </div>

            <div className="flex items-center gap-3 min-inline-0">
                <UserAvatar name={owner.name} size="md" fallback="shape" className="shrink-0" />
                <div className="min-inline-0">
                    <h2 className="body truncate font-bold capitalize text-ink">{owner.name}</h2>
                    {canContact && owner.phoneDigits ? (
                        <a
                            href={`tel:+91${owner.phoneDigits}`}
                            onClick={(event) => event.stopPropagation()}
                            className="body-sm mbs-0.5 block truncate tabular text-ink-muted hover:text-brand-text"
                        >
                            {formatPhoneIn(owner.phoneDigits)}
                        </a>
                    ) : (
                        <span className="body-sm mbs-0.5 block text-ink-muted">Number hidden</span>
                    )}
                </div>
            </div>

            <div className="flex flex-1 flex-col gap-1.5 min-inline-0">
                <p className="h5 truncate font-semibold tabular text-brand">{model.askingPrice}</p>
                {needLine ? (
                    <p className="body-sm truncate text-ink-muted">{needLine}</p>
                ) : (
                    <p className="body-sm flex items-center gap-1.5 text-ink-subtle">
                        <MapPin
                            aria-hidden
                            className="shrink-0 block-3.5 inline-3.5"
                            strokeWidth={1.75}
                        />
                        Details not set
                    </p>
                )}
            </div>

            <footer className="mt-auto flex flex-col gap-2.5 border-bs border-border-warm pbs-3">
                <p className="body-xs text-ink-muted">{spokeLabel}</p>

                <div onClick={(event) => event.stopPropagation()}>
                    {propertyCount > 0 ? (
                        <AttachedPropertiesRow
                            properties={model.properties}
                            onManage={() => (onOpenProperties ? onOpenProperties(owner) : open())}
                        />
                    ) : attach ? (
                        <Button
                            size="md"
                            variant="outline"
                            type="button"
                            className={cn("inline-full", OVERLAY_GLASS_BUTTON_CLASS)}
                            onClick={attach}
                        >
                            <UserPlus aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
                            Attach property
                        </Button>
                    ) : null}
                </div>

                {canContact && owner.phoneDigits ? (
                    <div
                        className="grid grid-cols-2 gap-2"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <Button
                            size="md"
                            variant="outline"
                            type="button"
                            className="inline-full"
                            nativeButton={false}
                            render={
                                <a
                                    href={`tel:+91${owner.phoneDigits}`}
                                    aria-label={`Call ${owner.name}`}
                                />
                            }
                        >
                            <Phone aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
                            Call
                        </Button>
                        <Button
                            size="md"
                            variant="accent"
                            type="button"
                            className="inline-full"
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
                ) : (
                    <p className="body-sm rounded-control bg-surface-muted px-3 py-2.5 text-center text-ink-muted">
                        Contact after representation
                    </p>
                )}
            </footer>
        </article>
    );
}
