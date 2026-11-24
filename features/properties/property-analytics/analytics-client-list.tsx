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
import { isPreviewAnalyticsClient } from "@/features/properties/property-analytics/mock-property-analytics";

import styles from "./analytics.module.css";

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
        <div className={styles.clientFact}>
            <dt className="body-xs text-ink-muted">{label}</dt>
            <dd className="body-sm text-ink min-inline-0">{children}</dd>
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
    // Cancelled visits are not counted, so a client may have only a cancelled one.
    const count = client.visits > 0 ? plural(client.visits, "visit") : "No visits booked";
    const visit = client.visit;
    if (!visit) return count;
    const when = visit.upcoming ? formatShowingWhen(visit.at, now) : formatDateShort(visit.at);
    const status = visit.running
        ? "Happening now"
        : visit.needsUpdate
          ? "Needs update"
          : visitStatusLabel(visit.status);
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
    const sample = isPreviewAnalyticsClient(client.id);
    const dealHref = brokerPipelineDealHref(client.id);
    const offer = offerText(client);
    const visit = visitText(client, now);
    const meta = [
        client.phone ? formatPhoneIn(client.phone) : "No phone number",
        client.addedAt ? `Added ${formatDateShort(client.addedAt)}` : null,
        client.updatedAt ? `Updated ${agoLabel(client.updatedAt, now)}` : null,
    ].filter(Boolean);

    return (
        <article className={styles.clientRow}>
            <div className={styles.clientIdentity}>
                <UserAvatar name={client.name} size="md" />
                <div className="flex flex-1 flex-col gap-0.5 min-inline-0">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <h3 className="body font-semibold text-ink capitalize">
                            <ContactName
                                name={client.name}
                                contactId={client.clientId}
                                contactType={sample ? undefined : "buyer"}
                                className="hover:text-brand-text hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                            />
                        </h3>
                        <StagePill client={client} closedWord={closedWord} />
                    </div>
                    <p className="body-sm wrap-anywhere text-ink-muted tabular-nums">
                        {meta.join(" · ")}
                    </p>
                    {client.email ? (
                        <p className="body-sm wrap-anywhere text-ink-muted">{client.email}</p>
                    ) : null}
                </div>
            </div>

            <dl className={styles.clientFacts}>
                <Fact label="Offer">
                    {offer ?? <span className="text-ink-muted">No offers yet</span>}
                </Fact>
                <Fact label="Visits">
                    {visit ?? <span className="text-ink-muted">No visits booked</span>}
                </Fact>
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

            <div className={styles.clientActions}>
                {client.phone ? (
                    <>
                        <Button
                            variant="outline"
                            size="md"
                            className="flex-1 sm:flex-none"
                            nativeButton={sample}
                            disabled={sample}
                            render={sample ? undefined : <a href={formatTelUrl(client.phone)} />}
                        >
                            <CallIcon aria-hidden strokeWidth={1.75} />
                            Call
                        </Button>
                        <Button
                            variant="outline"
                            size="md"
                            className="flex-1 sm:flex-none"
                            nativeButton={sample}
                            disabled={sample}
                            render={
                                sample ? undefined : (
                                    <a
                                        href={formatWhatsAppUrl(
                                            client.phone,
                                            `Hi ${client.name}, this is about ${propertyTitle}.`,
                                        )}
                                        target="_blank"
                                        rel="noreferrer"
                                    />
                                )
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
                    className="ms-auto"
                    nativeButton={sample}
                    disabled={sample}
                    render={sample ? undefined : <Link href={dealHref} />}
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
    className,
}: {
    report: PropertyReport;
    propertyTitle: string;
    now: Date;
    className?: string;
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
        <section
            aria-labelledby="analytics-clients-heading"
            className={cn(
                "flex flex-col gap-4 rounded-card bg-surface p-4 shadow-sm ring-1 ring-border-warm/50 min-inline-0 sm:p-5",
                className,
            )}
        >
            <Tabs
                value={filter}
                onValueChange={(value) => setFilter(value as Filter)}
                className="flex flex-col gap-3"
            >
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-col gap-1">
                        <h2 id="analytics-clients-heading" className="h5 text-ink">
                            Clients{" "}
                            <span className="text-ink-muted tabular-nums">{counts.total}</span>
                        </h2>
                        <p className="body-sm text-ink-muted">
                            Every conversation and deal in one place
                        </p>
                    </div>
                    {showTabs ? (
                        <StatusTabs label="Show clients" value={filter} tabs={tabs} />
                    ) : null}
                </div>
                <TabsContent value={filter}>
                    <ul className="divide-y divide-border-warm">
                        {visible.map((client) => (
                            <li key={client.id} className="py-4 first:pbs-0 last:pbe-0">
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
