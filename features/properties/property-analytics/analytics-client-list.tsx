"use client";

import { type ReactNode, useState } from "react";

import { formatDateShort, formatShowingWhen } from "@/lib/format/date";
import { formatPhoneIn, formatTelUrl, formatWhatsAppUrl } from "@/lib/format/phone";
import { plural } from "@/lib/format/plural";
import { brokerPipelineDealHref } from "@/lib/routes/broker";
import { cn } from "@/lib/utils";

import { ContactName } from "@/components/shared/contact-name";
import { ArrowRight, CallIcon, StickyNote, WhatsAppIcon } from "@/components/shared/icons";
import { type StatusTab, StatusTabs } from "@/components/shared/status-tabs";
import { UserAvatar } from "@/components/shared/user-avatar";
import { WorkflowLink as Link } from "@/components/shared/workflow-link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";

import { OFFER_STATUS_LABEL } from "@/features/pipeline/stage-meta";
import {
    agoLabel,
    formatSideAmount,
    offerGapLabel,
    statusDotClass,
    statusLabel,
    visitStatusLabel,
} from "@/features/properties/property-analytics/analytics-labels";
import type {
    ClientGroup,
    ClientRow,
    PropertyReport,
} from "@/features/properties/property-analytics/analytics-math";

type Filter = "all" | ClientGroup;

function StagePill({ client, closedWord }: { client: ClientRow; closedWord: string }) {
    return (
        <span className="body-xs inline-flex shrink-0 items-center gap-1.5 rounded-full bg-surface-muted px-2.5 py-1 font-semibold text-ink">
            <span
                aria-hidden
                className={cn("rounded-full block-1.5 inline-1.5", statusDotClass(client.status))}
            />
            {statusLabel(client.status, closedWord)}
        </span>
    );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="flex items-baseline gap-2 min-inline-0">
            <dt className="shrink-0 text-ink-muted inline-16">{label}</dt>
            <dd className="text-ink min-inline-0">{children}</dd>
        </div>
    );
}

function offerText(client: ClientRow): string | null {
    if (client.group === "won" && client.closedInr != null) {
        return `Closed at ${formatSideAmount(client.closedInr, client.side)}`;
    }
    const offer = client.offer;
    if (!offer) return null;
    return [
        formatSideAmount(offer.amountInr, offer.side),
        offer.status ? OFFER_STATUS_LABEL[offer.status] : null,
        offerGapLabel(offer),
    ]
        .filter(Boolean)
        .join(" · ");
}

function visitText(client: ClientRow, now: Date): string | null {
    if (client.visits === 0 && !client.visit) return null;
    const count = plural(Math.max(client.visits, 1), "visit");
    const visit = client.visit;
    if (!visit) return count;
    const when = visit.upcoming ? formatShowingWhen(visit.at, now) : formatDateShort(visit.at);
    const status = visit.needsUpdate ? "Needs update" : visitStatusLabel(visit.status);
    return `${count} · ${visit.upcoming ? "Next" : "Latest"} ${when}${status ? ` (${status})` : ""}`;
}

function ClientCard({
    client,
    closedWord,
    propertyTitle,
    now,
}: {
    client: ClientRow;
    closedWord: string;
    propertyTitle: string;
    now: Date;
}) {
    const dealHref = brokerPipelineDealHref(client.id);
    const offer = offerText(client);
    const visit = visitText(client, now);
    const meta = [
        client.phone ? formatPhoneIn(client.phone) : "No phone number",
        client.addedAt ? `Added ${formatDateShort(client.addedAt)}` : null,
        client.updatedAt ? `Updated ${agoLabel(client.updatedAt, now)}` : null,
    ].filter(Boolean);

    return (
        <article className="flex flex-col gap-3 p-4 md:p-5">
            <div className="flex items-start gap-3">
                <UserAvatar name={client.name} size="md" />
                <div className="flex flex-1 flex-col gap-0.5 min-inline-0">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <h3 className="body font-semibold text-ink capitalize">
                            <ContactName
                                name={client.name}
                                contactId={client.clientId}
                                contactType="buyer"
                                className="hover:text-brand-text hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                            />
                        </h3>
                        <StagePill client={client} closedWord={closedWord} />
                    </div>
                    <p className="body-sm text-ink-muted tabular-nums">{meta.join(" · ")}</p>
                </div>
            </div>

            <dl className="body-sm flex flex-col gap-1.5">
                <Fact label="Offer">
                    {offer ?? <span className="text-ink-muted">None yet</span>}
                </Fact>
                <Fact label="Visits">
                    {visit ?? <span className="text-ink-muted">None booked</span>}
                </Fact>
                {client.email ? <Fact label="Email">{client.email}</Fact> : null}
            </dl>

            {client.note ? (
                <p className="body-sm flex items-start gap-2 rounded-inner bg-surface-muted px-3 py-2 text-ink-muted">
                    <StickyNote
                        aria-hidden
                        className="mbs-0.5 shrink-0 block-4 inline-4"
                        strokeWidth={1.75}
                    />
                    <span className="wrap-break-word min-inline-0">{client.note}</span>
                </p>
            ) : null}

            <div className="flex flex-wrap gap-2">
                {client.phone ? (
                    <>
                        <Button
                            variant="outline"
                            size="md"
                            className="flex-1 sm:flex-none"
                            nativeButton={false}
                            render={<a href={formatTelUrl(client.phone)} />}
                        >
                            <CallIcon aria-hidden strokeWidth={1.75} />
                            Call
                        </Button>
                        <Button
                            variant="outline"
                            size="md"
                            className="flex-1 sm:flex-none"
                            nativeButton={false}
                            render={
                                <a
                                    href={formatWhatsAppUrl(
                                        client.phone,
                                        `Hi ${client.name}, this is about ${propertyTitle}.`,
                                    )}
                                    target="_blank"
                                    rel="noreferrer"
                                />
                            }
                        >
                            <WhatsAppIcon aria-hidden strokeWidth={1.75} />
                            WhatsApp
                        </Button>
                    </>
                ) : null}
                <Button
                    variant="ghost"
                    size="md"
                    className="max-sm:inline-full sm:ms-auto"
                    nativeButton={false}
                    render={<Link href={dealHref} />}
                >
                    Open deal
                    <ArrowRight aria-hidden />
                </Button>
            </div>
        </article>
    );
}

/** Every client on this listing. Active first, then most recently updated (API order). */
export function AnalyticsClientList({
    report,
    propertyTitle,
    now,
}: {
    report: PropertyReport;
    propertyTitle: string;
    now: Date;
}) {
    const [filter, setFilter] = useState<Filter>("all");
    const { clients, counts, closedWord } = report;

    const tabs: StatusTab[] = [
        { value: "all", label: "All", dotClassName: "bg-ink-subtle", count: counts.total },
        { value: "active", label: "Active", dotClassName: "bg-brand/50", count: counts.active },
        { value: "won", label: closedWord, dotClassName: "bg-brand", count: counts.won },
        { value: "lost", label: "Lost", dotClassName: "bg-ink-subtle/40", count: counts.lost },
    ].filter((tab) => tab.value === "all" || (tab.count ?? 0) > 0);
    // One group only: the chips would just repeat "All".
    const showTabs = tabs.length > 2;
    const visible = filter === "all" ? clients : clients.filter((c) => c.group === filter);

    return (
        <section aria-labelledby="analytics-clients-heading" className="flex flex-col gap-3">
            <Tabs
                value={filter}
                onValueChange={(value) => setFilter(value as Filter)}
                className="flex flex-col gap-3"
            >
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 id="analytics-clients-heading" className="h5 text-ink">
                        Clients <span className="text-ink-muted tabular-nums">{counts.total}</span>
                    </h2>
                    {showTabs ? (
                        <StatusTabs label="Show clients" value={filter} tabs={tabs} />
                    ) : null}
                </div>
                <TabsContent value={filter}>
                    <ul className="divide-y divide-border-warm overflow-hidden rounded-card bg-surface shadow-sm ring-1 ring-border-warm/50">
                        {visible.map((client) => (
                            <li key={client.id}>
                                <ClientCard
                                    client={client}
                                    closedWord={closedWord}
                                    propertyTitle={propertyTitle}
                                    now={now}
                                />
                            </li>
                        ))}
                    </ul>
                </TabsContent>
            </Tabs>
        </section>
    );
}
