"use client";

import { MapPin, Plus } from "lucide-react";

import { calendarDaysBetween, formatRelativePast } from "@/lib/format/date";
import { formatPhoneIn } from "@/lib/format/phone";
import { cn } from "@/lib/utils";

import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { toBuyerContactCardModel } from "@/features/contacts/contact-card-model";
import { ContactCardActions } from "@/features/contacts/contact-card-actions";
import { PropertyCoverStack } from "@/features/contacts/property-cover-stack";
import type { BuyerRow } from "@/features/contacts/types";

function priorityTitle(priority: "hot" | "warm" | "cold") {
    return `${priority[0]?.toUpperCase()}${priority.slice(1)} priority`;
}

function followUpLabel(value: string): { label: string; overdue: boolean } {
    const date = new Date(`${value}T12:00:00`);
    const overdue = date.getTime() < new Date(new Date().toDateString()).getTime();
    const day = new Intl.DateTimeFormat("en-IN", { weekday: "short" }).format(date);
    return { label: overdue ? `Follow-up overdue` : `Follow up ${day}`, overdue };
}

function Recency({ value, onLogCall }: { value: string | null; onLogCall: () => void }) {
    if (!value) {
        return (
            <div className="flex items-center gap-2 text-ink-muted">
                <span
                    className="rounded-full border border-ink-subtle block-2 inline-2"
                    aria-hidden
                />
                <span>Not contacted yet</span>
                <button
                    type="button"
                    className="font-semibold text-brand-text underline-offset-4 hover:underline"
                    onClick={(event) => {
                        event.stopPropagation();
                        onLogCall();
                    }}
                >
                    Log a call
                </button>
            </div>
        );
    }

    const date = new Date(value);
    const days = calendarDaysBetween(date, new Date());
    return (
        <div className="flex items-center gap-2 text-ink-muted">
            <span
                className={cn(
                    "rounded-full block-2 inline-2",
                    days <= 3 && "bg-success",
                    days > 3 && days <= 14 && "bg-pending",
                    days > 14 && "bg-ink-subtle",
                )}
                aria-hidden
            />
            <span>Spoke {formatRelativePast(date, new Date())}</span>
        </div>
    );
}

export function BuyerCard({
    buyer,
    onOpen,
    onEdit,
    onAttachProperties,
    onOpenProperties,
}: {
    buyer: BuyerRow;
    onOpen: (buyer: BuyerRow) => void;
    onEdit: (buyer: BuyerRow) => void;
    onAttachProperties: (buyer: BuyerRow) => void;
    onOpenProperties?: (buyer: BuyerRow) => void;
    onViewLeads?: (buyer: BuyerRow) => void;
}) {
    const model = toBuyerContactCardModel(buyer);
    const followUp = model.nextFollowUpAt ? followUpLabel(model.nextFollowUpAt) : null;

    const open = () => onOpen(buyer);
    const attach = () => onAttachProperties(buyer);

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
            className="
              contact-card group/card flex cursor-pointer flex-col rounded-card border
              border-border-warm bg-surface p-4 outline-none min-block-[292px]
              focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-brand/20
            "
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-inline-0">
                    <UserAvatar
                        name={buyer.name}
                        size="md"
                        fallback="initials-color"
                        className="shrink-0 rounded-[12px]"
                    />
                    <div className="min-inline-0">
                        <div className="flex items-center gap-2">
                            <h2 className="body-sm truncate font-bold text-ink">{buyer.name}</h2>
                            <Tooltip>
                                <TooltipTrigger
                                    render={
                                        <span
                                            role="img"
                                            title={priorityTitle(model.priority)}
                                            aria-label={priorityTitle(model.priority)}
                                            className={cn(
                                                "shrink-0 rounded-full block-2 inline-2",
                                                model.priority === "hot" && "bg-urgent",
                                                model.priority === "warm" && "bg-pending",
                                                model.priority === "cold" && "bg-ink-subtle",
                                            )}
                                        />
                                    }
                                />
                                <TooltipContent>{priorityTitle(model.priority)}</TooltipContent>
                            </Tooltip>
                        </div>
                        <a
                            href={`tel:+91${buyer.phoneDigits}`}
                            onClick={(event) => event.stopPropagation()}
                            className="body-xs tabular text-ink-muted hover:text-brand-text hover:underline"
                        >
                            {formatPhoneIn(buyer.phoneDigits)}
                        </a>
                    </div>
                </div>

                <ContactCardActions
                    name={buyer.name}
                    phoneDigits={buyer.phoneDigits}
                    onOpen={open}
                    onEdit={() => onEdit(buyer)}
                    onAttach={attach}
                    onNotes={open}
                />
            </div>

            <div className="mbs-4 flex flex-wrap items-center gap-1.5">
                <Badge
                    variant="brand"
                    className={cn(
                        buyer.lookingFor === "rent" &&
                            "border-pending/20 bg-urgent-soft/65 text-pending",
                    )}
                >
                    {buyer.lookingFor === "rent" ? "Renting" : "Buying"}
                </Badge>
                {model.propertyTypes.slice(0, 1).map((type) => (
                    <Badge key={type} variant="outline" className="text-ink">
                        {type}
                    </Badge>
                ))}
                {model.configurations.slice(0, 1).map((configuration) => (
                    <Badge key={configuration} variant="outline" className="text-ink">
                        {configuration}
                    </Badge>
                ))}
                <Badge variant="neutral" className="tabular font-bold text-ink">
                    {model.budgetLabel}
                </Badge>
            </div>

            <div className="mbs-3 flex items-center gap-1.5 min-block-5">
                <MapPin
                    aria-hidden
                    className="shrink-0 text-ink-subtle block-3.5 inline-3.5"
                    strokeWidth={1.75}
                />
                <p className="body-xs truncate text-ink-muted">
                    {model.localities.slice(0, 2).join(", ") || "Localities not set"}
                </p>
                {model.localities.length > 2 ? (
                    <Tooltip>
                        <TooltipTrigger
                            render={
                                <span className="body-xs shrink-0 font-semibold text-brand-text">
                                    +{model.localities.length - 2}
                                </span>
                            }
                        />
                        <TooltipContent>{model.localities.slice(2).join(", ")}</TooltipContent>
                    </Tooltip>
                ) : null}
            </div>

            <div className="mbs-3 flex-1">
                {model.properties.length ? (
                    <PropertyCoverStack
                        properties={model.properties}
                        onAttach={attach}
                        onOpenOverflow={() => (onOpenProperties ? onOpenProperties(buyer) : open())}
                    />
                ) : (
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            attach();
                        }}
                        className="
                          body-xs flex items-center justify-center gap-2 rounded-inner border
                          border-dashed border-brand/35 bg-brand-soft/25 px-3 font-semibold
                          text-brand-text transition-colors block-12 inline-full
                          hover:bg-brand-soft/60
                          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30
                        "
                    >
                        <Plus aria-hidden className="block-4 inline-4" />
                        Attach property
                    </button>
                )}
            </div>

            <footer className="body-xs mbs-3 flex items-center justify-between gap-2 border-bs border-border-warm pbs-3 min-block-8">
                <Recency value={buyer.lastContactedAt} onLogCall={open} />
                {followUp ? (
                    <span
                        className={cn(
                            "tabular shrink-0 rounded-md bg-surface-muted px-2 py-1 font-semibold text-ink-muted",
                            followUp.overdue && "bg-urgent-soft text-urgent",
                        )}
                    >
                        {followUp.label}
                    </span>
                ) : null}
            </footer>
        </article>
    );
}
