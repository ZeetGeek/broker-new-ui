"use client";

import { AlertCircle, Check, MapPin } from "lucide-react";

import type { PropertyLead } from "@/lib/api/owner-leads";
import { formatAreaSqft } from "@/lib/format/area";
import { parseInr } from "@/lib/format/inr";
import { formatPriceInr } from "@/lib/format/price";
import { cn } from "@/lib/utils";

import { AppModal } from "@/components/shared/app-modal";
import { AppModalFooter } from "@/components/shared/app-modal-footer";
import { Price } from "@/components/shared/price";
import { PropertyThumb } from "@/components/shared/property-thumb";
import { UserAvatar } from "@/components/shared/user-avatar";

import {
    leadBrokerLabel,
    leadClientLabel,
    leadPropertyFacts,
    leadPropertyLabel,
} from "@/features/owner-leads/owner-lead-meta";

/** How the offer sits against the owner's own price, in words. */
function priceGap(
    offerInr: number,
    askingInr: number | null,
): { label: string; tone: string } | null {
    if (askingInr == null || askingInr <= 0) return null;
    const diff = offerInr - askingInr;
    if (diff === 0) return { label: "Matches your price", tone: "text-success" };

    const percent = Math.round((Math.abs(diff) / askingInr) * 100);
    const amount = formatPriceInr(Math.abs(diff));
    const share = percent > 0 ? ` (${percent}%)` : "";
    return diff > 0
        ? { label: `${amount}${share} above your price`, tone: "text-success" }
        : { label: `${amount}${share} below your price`, tone: "text-urgent" };
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-3 py-2.5">
            <span className="body-sm text-ink-muted">{label}</span>
            <span className="body-sm text-end font-semibold text-ink min-inline-0">{children}</span>
        </div>
    );
}

function Person({ name }: { name: string }) {
    return (
        <span className="flex items-center justify-end gap-2 min-inline-0">
            <UserAvatar name={name} size="2xs" fallback="character" className="shrink-0" />
            <span className="truncate">{name}</span>
        </span>
    );
}

/**
 * Accepting an offer closes the deal as sold at the offered price, and the
 * owner cannot take that back from here — so it is confirmed against the full
 * offer, never fired straight from the card.
 */
export function AcceptOfferModal({
    lead,
    isSaving,
    error,
    onConfirm,
    onCancel,
}: {
    /** The lead whose offer is being accepted. `null` keeps the modal closed. */
    lead: PropertyLead | null;
    isSaving: boolean;
    /** Shown inline so a failed accept is not lost in a vanishing toast. */
    error: string | null;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    if (!lead) return null;

    const facts = leadPropertyFacts(lead);
    const propertyLabel = leadPropertyLabel(lead);
    const offerInr = parseInr(lead.offerAmount);
    const gap = offerInr != null ? priceGap(offerInr, facts.askingInr) : null;
    const notes = lead.notes?.trim();
    const configLine = [
        facts.configLabel,
        facts.areaSqft ? formatAreaSqft(facts.areaSqft) : null,
        facts.locality,
    ]
        .filter(Boolean)
        .join(" · ");

    return (
        <AppModal
            open
            onOpenChange={(next) => {
                if (!next && !isSaving) onCancel();
            }}
            size="sm"
            title="Accept this offer?"
            description="Your property will be marked as sold at this price. You can't undo this from here."
            footer={
                <AppModalFooter
                    primaryLabel={
                        isSaving
                            ? "Accepting…"
                            : offerInr != null
                              ? `Accept ${formatPriceInr(offerInr)}`
                              : "Accept offer"
                    }
                    primaryIcon={<Check aria-hidden strokeWidth={2} />}
                    onPrimary={onConfirm}
                    primaryDisabled={isSaving}
                    secondaryLabel="Cancel"
                    onSecondary={onCancel}
                    secondaryDisabled={isSaving}
                />
            }
        >
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                    <PropertyThumb
                        src={facts.imageSrc}
                        alt={propertyLabel}
                        sizeClassName="block-14 inline-18"
                        sizes="72px"
                        hoverScale={false}
                    />
                    <div className="flex flex-col gap-0.5 min-inline-0">
                        <p className="body-sm truncate font-semibold text-ink">{propertyLabel}</p>
                        {configLine ? (
                            <p className="body-xs flex items-center gap-1 text-ink-muted">
                                <MapPin
                                    aria-hidden
                                    className="shrink-0 block-3 inline-3"
                                    strokeWidth={1.75}
                                />
                                <span className="truncate">{configLine}</span>
                            </p>
                        ) : null}
                    </div>
                </div>

                <div className="flex flex-col gap-1 rounded-inner bg-surface-muted p-4">
                    <span className="body-xs text-ink-subtle">Buyer&apos;s offer</span>
                    {offerInr != null ? (
                        <Price amountInr={offerInr} isRent={facts.isRent} className="h4" />
                    ) : (
                        <span className="h5 text-ink-muted">Amount not shared</span>
                    )}
                    {gap ? (
                        <span className={cn("body-sm font-semibold", gap.tone)}>{gap.label}</span>
                    ) : null}
                </div>

                <div className="flex flex-col divide-y divide-border-warm">
                    {facts.askingInr != null ? (
                        <DetailRow label="Your price">
                            <Price
                                amountInr={facts.askingInr}
                                isRent={facts.isRent}
                                className="text-ink"
                            />
                        </DetailRow>
                    ) : null}
                    <DetailRow label="Buyer">
                        <Person name={leadClientLabel(lead)} />
                    </DetailRow>
                    <DetailRow label="Broker">
                        <Person name={leadBrokerLabel(lead)} />
                    </DetailRow>
                </div>

                {notes ? (
                    <div className="flex flex-col gap-1">
                        <span className="body-xs text-ink-subtle">Broker&apos;s note</span>
                        <p className="body-sm text-ink">{notes}</p>
                    </div>
                ) : null}

                {error ? (
                    <p
                        role="alert"
                        className="
                          body-sm flex items-start gap-2 rounded-inner bg-danger-soft p-3
                          text-danger
                        "
                    >
                        <AlertCircle
                            aria-hidden
                            className="mbs-0.5 shrink-0 block-4 inline-4"
                            strokeWidth={2}
                        />
                        {error}
                    </p>
                ) : null}
            </div>
        </AppModal>
    );
}
