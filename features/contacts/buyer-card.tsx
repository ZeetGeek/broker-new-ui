"use client";

import { addCollection, Icon } from "@iconify/react/offline";
import { MapPin, Phone, UserPlus } from "lucide-react";

import { formatPhoneIn, formatWhatsAppUrl } from "@/lib/format/phone";
import { cn } from "@/lib/utils";

import { OVERLAY_GLASS_BUTTON_CLASS } from "@/components/shared/overlay-card";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";

import { AttachedPropertiesRow } from "@/features/contacts/attached-properties-row";
import { toBuyerContactCardModel } from "@/features/contacts/contact-card-model";
import { ContactCardActions } from "@/features/contacts/contact-card-actions";
import type { BuyerRow } from "@/features/contacts/types";
import whatsappIcons from "@/features/properties/my-requests/bi-whatsapp.json";

addCollection(whatsappIcons as Parameters<typeof addCollection>[0]);

function followUpLabel(value: string): { label: string; overdue: boolean } {
    const date = new Date(`${value}T12:00:00`);
    const overdue = date.getTime() < new Date(new Date().toDateString()).getTime();
    const day = new Intl.DateTimeFormat("en-IN", { weekday: "short" }).format(date);
    return { label: overdue ? "Follow-up overdue" : `Follow up ${day}`, overdue };
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
    const model = toBuyerContactCardModel(buyer);
    const followUp = model.nextFollowUpAt ? followUpLabel(model.nextFollowUpAt) : null;
    const isHot = model.priority === "hot";
    const isOverdue = Boolean(followUp?.overdue);

    const open = () => onOpen(buyer);
    const attach = () => onAttachProperties(buyer);
    const propertyCount = model.properties.length;
    const needLine = model.importantLocation || null;

    return (
        <article
            role="button"
            data-contact-id={buyer.id}
            tabIndex={0}
            aria-label={`Open ${buyer.name}`}
            onClick={open}
            onKeyDown={(event) => {
                if (event.key === "Enter") open();
            }}
            className={cn(
                `
                  contact-card group/card relative flex h-full cursor-pointer flex-col gap-3
                  rounded-card border border-border-warm bg-surface p-4 outline-none shadow-md
                  transition-[box-shadow] duration-160 hover:shadow-lg
                  focus-visible:ring-3 focus-visible:ring-brand/20
                `,
                isOverdue && "border-urgent/40 bg-urgent-soft/25",
            )}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-inline-0">
                    <UserAvatar name={buyer.name} size="md" fallback="shape" className="shrink-0" />
                    <div className="min-inline-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                            <h2 className="body truncate font-bold capitalize text-ink">
                                {buyer.name}
                            </h2>
                            {isOverdue || isHot ? (
                                <span
                                    className={cn(
                                        "body-xs shrink-0 rounded-md px-1.5 py-0.5 font-semibold",
                                        isOverdue
                                            ? "bg-urgent-soft text-urgent"
                                            : "bg-brand-soft text-brand-text",
                                    )}
                                >
                                    {isOverdue ? "Overdue" : "Hot"}
                                </span>
                            ) : null}
                            {buyer.lookingFor === "rent" ? (
                                <span className="body-xs shrink-0 font-medium text-ink-muted">
                                    Renting
                                </span>
                            ) : buyer.lookingFor === "both" ? (
                                <span className="body-xs shrink-0 font-medium text-ink-muted">
                                    Buy or rent
                                </span>
                            ) : null}
                        </div>
                        <a
                            href={`tel:+91${buyer.phoneDigits}`}
                            onClick={(event) => event.stopPropagation()}
                            className="body-sm mbs-0.5 block truncate tabular text-ink-muted hover:text-brand-text"
                        >
                            {formatPhoneIn(buyer.phoneDigits)}
                        </a>
                    </div>
                </div>

                <div onClick={(event) => event.stopPropagation()}>
                    <ContactCardActions
                        name={buyer.name}
                        phoneDigits={buyer.phoneDigits}
                        onOpen={open}
                        onEdit={() => onEdit(buyer)}
                        onAttach={attach}
                        onNotes={open}
                        onDelete={onDelete ? () => onDelete(buyer) : undefined}
                        density="menu"
                    />
                </div>
            </div>

            <div className="flex flex-1 flex-col gap-1.5 min-inline-0">
                <p className="h5 truncate font-semibold tabular text-brand">{model.budgetLabel}</p>
                {needLine ? (
                    <p className="body-sm truncate text-ink-muted">{needLine}</p>
                ) : (
                    <p className="body-sm flex items-center gap-1.5 text-ink-subtle">
                        <MapPin
                            aria-hidden
                            className="shrink-0 block-3.5 inline-3.5"
                            strokeWidth={1.75}
                        />
                        Requirements not set
                    </p>
                )}
                {followUp && !followUp.overdue ? (
                    <p className="body-xs font-medium text-ink-muted">{followUp.label}</p>
                ) : null}
            </div>

            <footer className="mt-auto flex flex-col gap-2.5">
                <div onClick={(event) => event.stopPropagation()}>
                    {propertyCount > 0 ? (
                        <AttachedPropertiesRow
                            properties={model.properties}
                            onManage={() => (onOpenProperties ? onOpenProperties(buyer) : open())}
                        />
                    ) : (
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
                    )}
                </div>

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
                                href={`tel:+91${buyer.phoneDigits}`}
                                aria-label={`Call ${buyer.name}`}
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
                                href={formatWhatsAppUrl(buyer.phoneDigits)}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`Message ${buyer.name} on WhatsApp`}
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
            </footer>
        </article>
    );
}
