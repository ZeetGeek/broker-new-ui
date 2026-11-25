"use client";

import { type ReactNode, useState } from "react";

import { formatCommission } from "@/lib/format/commission";
import { DEFAULT_CURRENCY } from "@/lib/format/currency";
import { formatPrice } from "@/lib/format/price";
import { cn } from "@/lib/utils";
import { useMobileMenu } from "@/hooks/use-mobile-menu";

import {
    CalendarCheck,
    CalendarClock,
    ChevronDown,
    ChevronRight,
    Clock,
    HandCoins,
    Info,
    Search,
    Users,
} from "@/components/shared/icons";
import { ListSearchField } from "@/components/shared/list-toolbar";
import { MobileSelectDrawer } from "@/components/shared/mobile-select-drawer";
import { PriceWithCommission } from "@/components/shared/price-with-commission";
import { SlidingTabs } from "@/components/shared/sliding-tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { type DealStatus } from "@/features/pipeline/types";
import { AnalyticsCard } from "@/features/properties/property-analytics/analytics-card";
import { statusLabel } from "@/features/properties/property-analytics/analytics-labels";
import {
    ClientProgressChart,
    OffersComparisonChart,
} from "@/features/properties/property-analytics/broker-analytics-charts";
import {
    DEMO_ASK_INR,
    DEMO_CLOSED_INR,
    DEMO_COMMISSION_PERCENT,
    DEMO_DAYS_LISTED,
    DEMO_VISITS,
    type DemoClient,
    getDemoClients,
} from "@/features/properties/property-analytics/broker-analytics-demo";
import { PropertyAttention } from "@/features/properties/property-analytics/property-attention";

import styles from "./broker-property-analytics.module.css";

function Section({
    id,
    title,
    description,
    action,
    className,
    children,
}: {
    id: string;
    title: string;
    description?: string;
    action?: ReactNode;
    className?: string;
    children: ReactNode;
}) {
    return (
        <AnalyticsCard
            titleId={id}
            title={title}
            description={description}
            action={action}
            className={cn(styles.section, className)}
        >
            {children}
        </AnalyticsCard>
    );
}

function Initials({ name }: { name: string }) {
    return (
        <span aria-hidden className={styles.avatar}>
            {name
                .split(" ")
                .map((part) => part[0])
                .slice(0, 2)
                .join("")}
        </span>
    );
}

function Stage({ stage }: { stage: DealStatus }) {
    return (
        <span
            className={cn(
                styles.stage,
                stage === "closed" && styles.stageClosed,
                stage === "lost" && styles.stageLost,
            )}
        >
            <span aria-hidden />
            {statusLabel(stage, "Closed")}
        </span>
    );
}

/** Static, broker-only design preview. All interactions stay inside this report. */
export function BrokerPropertyAnalytics({
    propertyTitle,
    propertyId,
}: {
    propertyTitle: string;
    propertyId: string;
}) {
    const mobile = useMobileMenu();
    const [closed, setClosed] = useState(false);
    const [query, setQuery] = useState("");
    const [clientFilter, setClientFilter] = useState("all");
    const [expandedClient, setExpandedClient] = useState<string | null>(null);
    const [showAllClients, setShowAllClients] = useState(false);
    const [showAllVisits, setShowAllVisits] = useState(false);
    const clients = getDemoClients(closed);
    const active = clients.filter((client) => client.stage !== "closed" && client.stage !== "lost");
    const offers = clients
        .filter((client) => client.offer != null)
        .sort((a, b) => b.offer! - a.offer!);
    const bestOffer = offers.find((client) => !client.withdrawn)!;
    const filtered = clients.filter((client) => {
        const matchesName = client.name.toLowerCase().includes(query.trim().toLowerCase());
        const matchesStage =
            clientFilter === "all" ||
            (clientFilter === "active"
                ? client.stage !== "closed" && client.stage !== "lost"
                : client.stage === clientFilter);
        return matchesName && matchesStage;
    });
    const visibleClients = showAllClients ? filtered : filtered.slice(0, 6);
    const commission = ((closed ? DEMO_CLOSED_INR : DEMO_ASK_INR) * DEMO_COMMISSION_PERCENT) / 100;

    function viewClient(client: DemoClient) {
        setQuery(client.name);
        setClientFilter("all");
        setExpandedClient(client.id);
        document
            .getElementById("broker-analytics-clients")
            ?.scrollIntoView({ behavior: "instant", block: "start" });
        document.getElementById("analytics-client-search")?.focus({ preventScroll: true });
    }

    return (
        <div className={styles.report}>
            <div className={styles.demoBanner}>
                <div>
                    <Info size={17} aria-hidden />
                    <p>
                        <strong>Sample figures.</strong> Needs your attention uses the same records
                        as your Tasks, Pipeline and Visits pages.
                    </p>
                </div>
                <div className={styles.scenario}>
                    <span>Demo scenario</span>
                    {mobile ? (
                        <div className="inline-40">
                            <MobileSelectDrawer
                                label="Demo scenario"
                                value={closed ? "closed" : "active"}
                                options={[
                                    { value: "active", label: "In progress" },
                                    { value: "closed", label: "Closed deal" },
                                ]}
                                onChange={(value) => setClosed(value === "closed")}
                            />
                        </div>
                    ) : (
                        <Select
                            value={closed ? "closed" : "active"}
                            items={[
                                { value: "active", label: "In progress" },
                                { value: "closed", label: "Closed deal" },
                            ]}
                            onValueChange={(value) => setClosed(value === "closed")}
                        >
                            <SelectTrigger
                                size="sm"
                                aria-label="Demo scenario"
                                wrapperClassName="inline-36"
                                className="border font-medium shadow-sm"
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">In progress</SelectItem>
                                <SelectItem value="closed">Closed deal</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                </div>
            </div>

            <header className={styles.reportHeader}>
                <div>
                    <h2>Property performance</h2>
                    <p>{propertyTitle}</p>
                </div>
                <Badge color={closed ? "emerald" : "amber"}>
                    {closed ? "Closed · Recorded by you" : "Deal in progress"}
                </Badge>
            </header>

            <section aria-labelledby="broker-overview-heading" className={styles.overview}>
                <h3 id="broker-overview-heading" className="sr-only">
                    Performance overview
                </h3>
                <dl>
                    <div>
                        <dt>
                            <Users size={18} aria-hidden />
                            Clients attached
                        </dt>
                        <dd>{clients.length}</dd>
                        <dd className={styles.overviewDetail}>
                            {active.length} active <span aria-hidden> / </span>{" "}
                            {closed ? "1 closed / 15 lost" : "2 lost"}
                        </dd>
                    </div>
                    <div>
                        <dt>
                            <CalendarCheck size={18} aria-hidden />
                            Visits completed
                        </dt>
                        <dd>{DEMO_VISITS.completed}</dd>
                        <dd className={styles.overviewDetail}>
                            {closed ? "All visits wrapped up" : "3 upcoming visits"}
                        </dd>
                    </div>
                    <div>
                        <dt>
                            <HandCoins size={18} aria-hidden />
                            Offers recorded
                        </dt>
                        <dd>{offers.length}</dd>
                        <dd className={styles.overviewDetail}>
                            {closed ? "1 converted to a deal" : "4 current / 1 withdrawn"}
                        </dd>
                    </div>
                    <div>
                        <dt>
                            <Clock size={18} aria-hidden />
                            {closed ? "Time to close" : "Days since added"}
                        </dt>
                        <dd>
                            {DEMO_DAYS_LISTED}
                            <span>days</span>
                        </dd>
                        <dd className={styles.overviewDetail}>
                            {closed ? "From adding to closing" : "Activity from your records"}
                        </dd>
                    </div>
                </dl>
            </section>

            <div className={styles.workspace}>
                <div className={styles.mainColumn}>
                    <PropertyAttention propertyId={propertyId} />

                    <Section
                        id="broker-progress-heading"
                        title="Client progress"
                        description="Where your clients are in the pipeline right now."
                        className={styles.progress}
                    >
                        <div className={styles.progressHeadline}>
                            <strong>
                                {active.length}
                                <span>active clients</span>
                            </strong>
                            <span>{closed ? "1 closed / 15 lost" : "2 marked as lost"}</span>
                        </div>
                        <ClientProgressChart clients={clients} />
                        <p className={styles.footnote}>
                            Each client appears once, in their current stage.
                        </p>
                    </Section>

                    <Section
                        id="broker-visits-heading"
                        title="Site visits"
                        description="Appointments and outcomes you have recorded."
                        className={styles.visits}
                        action={
                            <CalendarClock size={21} className={styles.sectionIcon} aria-hidden />
                        }
                    >
                        <dl className={styles.visitMetrics}>
                            <div>
                                <dt>Completed</dt>
                                <dd>{DEMO_VISITS.completed}</dd>
                            </div>
                            <div>
                                <dt>Upcoming</dt>
                                <dd>{closed ? 0 : 3}</dd>
                            </div>
                            <div>
                                <dt>Cancelled</dt>
                                <dd>{closed ? 4 : 1}</dd>
                            </div>
                            <div>
                                <dt>{closed ? "Not attended" : "Needs outcome"}</dt>
                                <dd className={closed ? undefined : styles.urgentText}>1</dd>
                            </div>
                        </dl>
                        <ul className={styles.appointments}>
                            {DEMO_VISITS.appointments
                                .slice(0, showAllVisits ? undefined : 3)
                                .map((visit) => {
                                    const client = clients.find(
                                        (item) => item.id === visit.clientId,
                                    )!;
                                    const status = closed
                                        ? visit.status === "Needs outcome"
                                            ? "Not attended"
                                            : "Cancelled"
                                        : visit.status;
                                    return (
                                        <li key={visit.clientId}>
                                            <div className={styles.visitDate}>
                                                <strong>{closed ? "Recorded" : visit.day}</strong>
                                                <span>{visit.time}</span>
                                            </div>
                                            <div className={styles.visitPerson}>
                                                <strong>{client.name}</strong>
                                                <span>{status}</span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                aria-label={`View ${client.name}'s visit`}
                                                onClick={() => viewClient(client)}
                                            >
                                                <ChevronRight aria-hidden />
                                            </Button>
                                        </li>
                                    );
                                })}
                        </ul>
                        <Button
                            variant="ghost"
                            className={styles.expandButton}
                            aria-expanded={showAllVisits}
                            onClick={() => setShowAllVisits(!showAllVisits)}
                        >
                            {showAllVisits ? "Show fewer visits" : "Show all 5 appointments"}
                            <ChevronDown
                                aria-hidden
                                className={showAllVisits ? styles.rotated : undefined}
                            />
                        </Button>
                    </Section>
                </div>

                <div className={styles.sideColumn}>
                    <Section
                        id="broker-offers-heading"
                        title="Offers vs asking price"
                        description="Amounts recorded by you, compared with the ask."
                        className={styles.offers}
                    >
                        <div className={styles.askRow}>
                            <span>Sample asking price</span>
                            <PriceWithCommission
                                audience="broker"
                                currency={DEFAULT_CURRENCY}
                                amountInr={DEMO_ASK_INR}
                                commissionPercent={DEMO_COMMISSION_PERCENT}
                                size="md"
                            />
                        </div>
                        <div className={styles.bestOffer}>
                            <span>
                                {closed ? "Recorded closing price" : "Highest current offer"}
                            </span>
                            <strong>{formatPrice(bestOffer.offer!, DEFAULT_CURRENCY)}</strong>
                            <p>
                                {bestOffer.name}
                                <span>
                                    {formatPrice(DEMO_ASK_INR - bestOffer.offer!, DEFAULT_CURRENCY)}{" "}
                                    below asking
                                </span>
                            </p>
                        </div>
                        <OffersComparisonChart offers={offers} />
                        <div className={styles.chartLegend}>
                            <span>
                                <i />
                                Current offers
                            </span>
                            <span>
                                <i className={styles.legendWithdrawn} />
                                Withdrawn
                            </span>
                        </div>
                        <p className={styles.footnote}>
                            <Info size={15} aria-hidden />
                            Offer records don’t confirm an owner’s decision.
                        </p>
                    </Section>

                    <section aria-labelledby="broker-outcome-heading" className={styles.outcome}>
                        <div className={styles.outcomeHeader}>
                            <h3 id="broker-outcome-heading">
                                Deal outcome &amp; estimated commission
                            </h3>
                            <HandCoins size={23} aria-hidden />
                        </div>
                        <span className={styles.outcomeStatus}>
                            {closed ? "Closed · Recorded by you" : "Not closed yet"}
                        </span>
                        <div className={styles.commissionAmount}>
                            <span>
                                {closed ? "Estimated deal commission" : "Potential commission"}
                            </span>
                            <strong>{formatCommission(commission)}</strong>
                            <p>
                                {DEMO_COMMISSION_PERCENT}% of{" "}
                                {closed ? "your recorded closing price" : "the sample asking price"}
                            </p>
                        </div>
                        <dl className={styles.outcomeFacts}>
                            <div>
                                <dt>Recorded closing price</dt>
                                <dd>
                                    {closed ? formatPrice(DEMO_CLOSED_INR, DEFAULT_CURRENCY) : "—"}
                                </dd>
                            </div>
                            <div>
                                <dt>Time to close</dt>
                                <dd>{closed ? `${DEMO_DAYS_LISTED} days` : "—"}</dd>
                            </div>
                            <div>
                                <dt>{closed ? "Closed with" : "Highest current offer"}</dt>
                                <dd>
                                    {closed
                                        ? "Karan Shah"
                                        : formatPrice(bestOffer.offer!, DEFAULT_CURRENCY)}
                                </dd>
                            </div>
                        </dl>
                        <p className={styles.outcomeNote}>
                            <Info size={16} aria-hidden />
                            {closed
                                ? "Estimated commission only. Payment received is not tracked here."
                                : "Based on asking price. This is an estimate, not earned commission."}
                        </p>
                    </section>
                </div>
            </div>

            <Section
                id="broker-analytics-clients"
                title="Clients on this property"
                description="The people behind the numbers, with their latest activity and next step."
                action={<span className={styles.count}>{clients.length}</span>}
                className={styles.clients}
            >
                <div className={styles.clientToolbar}>
                    <SlidingTabs
                        value={clientFilter}
                        options={[
                            { value: "all", label: "All clients", count: clients.length },
                            { value: "active", label: "Active", count: active.length },
                            { value: "closed", label: "Closed", count: closed ? 1 : 0 },
                            { value: "lost", label: "Lost", count: closed ? 15 : 2 },
                        ]}
                        onValueChange={(value) => {
                            setClientFilter(value);
                            setShowAllClients(false);
                        }}
                        label="Filter clients"
                        panelId="analytics-client-results"
                        height={38}
                    />
                    <ListSearchField
                        id="analytics-client-search"
                        aria-label="Search clients in this report"
                        placeholder="Search clients"
                        debounceMs={0}
                        value={query}
                        onChange={(value) => {
                            setQuery(value);
                            setShowAllClients(false);
                        }}
                    />
                </div>
                <div
                    id="analytics-client-results"
                    role="tabpanel"
                    aria-label={`${clientFilter === "all" ? "All" : clientFilter} clients`}
                >
                    <div className={styles.clientColumns} aria-hidden>
                        <span>Client</span>
                        <span>Current stage</span>
                        <span>Recorded offer</span>
                        <span>Next follow-up</span>
                        <span />
                    </div>
                    <ul className={styles.clientList}>
                        {visibleClients.map((client) => (
                            <li key={client.id}>
                                <div className={styles.clientRow}>
                                    <div className={styles.clientIdentity}>
                                        <Initials name={client.name} />
                                        <div>
                                            <strong>{client.name}</strong>
                                            <span>{client.type}</span>
                                        </div>
                                    </div>
                                    <div className={styles.clientStage}>
                                        <Stage stage={client.stage} />
                                    </div>
                                    <div className={styles.clientOffer}>
                                        <span className={styles.mobileLabel}>Recorded offer</span>
                                        <strong>
                                            {client.offer
                                                ? formatPrice(client.offer, DEFAULT_CURRENCY)
                                                : "—"}
                                        </strong>
                                    </div>
                                    <div className={styles.clientFollowup}>
                                        <span className={styles.mobileLabel}>Next follow-up</span>
                                        <span
                                            className={
                                                client.attention?.kind === "overdue"
                                                    ? styles.urgentText
                                                    : undefined
                                            }
                                        >
                                            {client.followUp}
                                        </span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        aria-label={`${expandedClient === client.id ? "Hide" : "Show"} ${client.name}'s details`}
                                        aria-expanded={expandedClient === client.id}
                                        aria-controls={`${client.id}-details`}
                                        onClick={() =>
                                            setExpandedClient(
                                                expandedClient === client.id ? null : client.id,
                                            )
                                        }
                                    >
                                        <ChevronDown
                                            aria-hidden
                                            className={
                                                expandedClient === client.id
                                                    ? styles.rotated
                                                    : undefined
                                            }
                                        />
                                    </Button>
                                </div>
                                <div
                                    id={`${client.id}-details`}
                                    hidden={expandedClient !== client.id}
                                    className={styles.clientDetails}
                                >
                                    <span>
                                        <strong>Latest activity</strong>
                                        {client.activity}
                                    </span>
                                    <span>
                                        <strong>Next step</strong>
                                        {client.stage === "closed"
                                            ? "Deal completed. Keep your closing records up to date."
                                            : client.stage === "lost"
                                              ? "No action needed on this property."
                                              : (client.attention?.title ??
                                                "Follow up at the scheduled time.")}
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                    {!filtered.length && (
                        <div className={styles.empty}>
                            <Search size={24} aria-hidden />
                            <div>
                                <strong>No matching clients</strong>
                                <p>Try another name or choose a different stage.</p>
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setQuery("");
                                        setClientFilter("all");
                                    }}
                                >
                                    Clear filters
                                </Button>
                            </div>
                        </div>
                    )}
                    <div className={styles.clientFooter}>
                        <p aria-live="polite">
                            Showing {visibleClients.length} of {filtered.length} clients
                        </p>
                        {filtered.length > 6 && (
                            <Button
                                variant="ghost"
                                aria-expanded={showAllClients}
                                onClick={() => setShowAllClients(!showAllClients)}
                            >
                                {showAllClients
                                    ? "Show fewer clients"
                                    : `Show all ${filtered.length} clients`}
                                <ChevronDown
                                    aria-hidden
                                    className={showAllClients ? styles.rotated : undefined}
                                />
                            </Button>
                        )}
                        {query && (
                            <Button variant="ghost" onClick={() => setQuery("")}>
                                Clear search
                            </Button>
                        )}
                    </div>
                </div>
            </Section>
            <p className={styles.reportFootnote}>
                <Info size={15} aria-hidden />
                This report reflects the broker’s records. All figures shown are illustrative.
            </p>
        </div>
    );
}
