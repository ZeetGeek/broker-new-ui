import type { PropertyAnalyticsLead } from "@/lib/api/property-analytics";
import { formatDateShort, formatRelativePast } from "@/lib/format/date";
import { formatPhoneIn, formatTelUrl, formatWhatsAppUrl } from "@/lib/format/phone";

import { CallIcon, StickyNote, WhatsAppIcon } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";

import { StagePill } from "@/features/owner-leads/owner-lead-meta";

import { amountLabel } from "./format";
import { OFFER_STATUS_LABEL, SHOWING_STATUS_LABEL } from "./stage-meta";

function updatedLabel(iso: string | null): string | null {
    if (!iso) return null;
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return null;
    return `Updated ${formatRelativePast(date, new Date()).toLowerCase()}`;
}

function Fact({ label, value, empty }: { label: string; value: string | null; empty: string }) {
    return (
        <div className="flex items-baseline gap-1.5 min-inline-0">
            <dt className="shrink-0 text-ink-muted">{label}</dt>
            <dd className={value ? "font-medium text-ink tabular-nums" : "text-ink-subtle"}>
                {value ?? empty}
            </dd>
        </div>
    );
}

function LeadRow({ lead }: { lead: PropertyAnalyticsLead }) {
    const name = lead.buyerName?.trim() || "Unnamed client";
    const phone = lead.buyerPhone?.trim() || null;
    const contact = [phone ? formatPhoneIn(phone) : null, lead.buyerEmail?.trim() || null]
        .filter(Boolean)
        .join(" · ");
    const updated = updatedLabel(lead.updatedAt);

    const offer = amountLabel(lead.offerAmount);
    const closed = amountLabel(lead.closedAmount);
    const offerValue = closed
        ? `Closed at ${closed}`
        : offer
          ? `${offer}${lead.offerStatus ? ` · ${OFFER_STATUS_LABEL[lead.offerStatus]}` : ""}`
          : null;

    const lastVisit = lead.latestShowing;
    const lastVisitValue = lastVisit?.scheduledDate
        ? [
              lastVisit.status ? (SHOWING_STATUS_LABEL[lastVisit.status] ?? null) : null,
              formatDateShort(new Date(lastVisit.scheduledDate)),
          ]
              .filter(Boolean)
              .join(" · ")
        : null;

    return (
        <article className="flex flex-col gap-3 p-4 md:p-5">
            <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1 min-inline-0">
                    <h3 className="body font-semibold text-ink capitalize">{name}</h3>
                    <p className="body-sm text-ink-muted">
                        {[contact || "No contact details", updated].filter(Boolean).join(" · ")}
                    </p>
                </div>
                <StagePill stage={lead.stage} />
            </div>

            <dl className="body-sm flex flex-wrap gap-x-6 gap-y-1.5">
                <Fact label="Offer" value={offerValue} empty="None yet" />
                <Fact
                    label="Visits"
                    value={lead.showings > 0 ? String(lead.showings) : null}
                    empty="None yet"
                />
                {lastVisitValue ? (
                    <Fact label="Last visit" value={lastVisitValue} empty="" />
                ) : null}
            </dl>

            {lead.notes?.trim() ? (
                <p
                    className="
                      body-sm flex items-start gap-2 rounded-inner bg-surface-muted px-3 py-2
                      text-ink-muted
                    "
                >
                    <StickyNote
                        aria-hidden
                        className="mbs-0.5 shrink-0 block-4 inline-4"
                        strokeWidth={1.75}
                    />
                    <span className="wrap-break-word min-inline-0">{lead.notes.trim()}</span>
                </p>
            ) : null}

            {phone ? (
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant="outline"
                        size="md"
                        nativeButton={false}
                        render={<a href={formatTelUrl(phone)} />}
                    >
                        <CallIcon aria-hidden strokeWidth={1.75} />
                        Call
                    </Button>
                    <Button
                        variant="outline"
                        size="md"
                        nativeButton={false}
                        render={
                            <a href={formatWhatsAppUrl(phone)} target="_blank" rel="noreferrer" />
                        }
                    >
                        <WhatsAppIcon aria-hidden strokeWidth={1.75} />
                        WhatsApp
                    </Button>
                </div>
            ) : null}
        </article>
    );
}

export function LeadList({ leads }: { leads: PropertyAnalyticsLead[] }) {
    return (
        <ul
            className="
              divide-y divide-border-warm overflow-hidden rounded-card border border-border-warm
              bg-surface shadow-sm
            "
        >
            {leads.map((lead) => (
                <li key={lead.id}>
                    <LeadRow lead={lead} />
                </li>
            ))}
        </ul>
    );
}
