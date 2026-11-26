import { cn } from "@/lib/utils";

import { LoadingState } from "@/components/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/shared/skeleton";

import commission from "./commission-earned.module.css";
import layout from "./dashboard.module.css";
import styles from "./dashboard-skeleton.module.css";
import inventory from "./inventory-and-updates.module.css";
import nextVisit from "./next-visit.module.css";

/** The route fallback and independent card loads share the same decorative shapes. */
function Block({ className }: { className?: string }) {
    return <Skeleton className={cn(styles.placeholder, className)} />;
}

export function DashboardStatSkeleton() {
    return (
        <span role="status" aria-label="Loading count" aria-busy="true">
            <Block className={styles.statValue} />
        </span>
    );
}

function CardHeader() {
    return (
        <div className={styles.header}>
            <Block className={styles.heading} />
            <Block className={styles.button} />
        </div>
    );
}

function Tabs({ two = false }: { two?: boolean }) {
    return (
        <div className={styles.tabs}>
            <Block />
            <Block />
            {!two && <Block />}
        </div>
    );
}

function Footer() {
    return (
        <div className={styles.footer}>
            <Block className={styles.short} />
            <Block className={styles.short} />
        </div>
    );
}

function PropertyDetails() {
    return (
        <div className={styles.property}>
            <Block className={styles.photo} />
            <div className={styles.lines}>
                <Block className={styles.title} />
                <Block className={styles.medium} />
                <Block className={styles.short} />
                <Block className={styles.medium} />
            </div>
        </div>
    );
}

export function NextVisitSkeleton() {
    return (
        <section className={cn(nextVisit.card, styles.featured)}>
            <div className={styles.header}>
                <Block className={styles.heading} />
                <Block className={styles.circle} />
            </div>
            <div className={styles.schedule}>
                <Block className={styles.time} />
                <Block className={styles.short} />
            </div>
            <PropertyDetails />
            <div className={styles.actions}>
                <Block className={styles.action} />
                <Block className={styles.action} />
            </div>
        </section>
    );
}

export function DashboardVisitListSkeleton() {
    return (
        <div className={styles.visitList}>
            {[0, 1].map((row) => (
                <div key={row} className={styles.visitRow}>
                    <div className={styles.schedule}>
                        <Block className={styles.time} />
                        <Block className={styles.circle} />
                    </div>
                    <PropertyDetails />
                    <div className={styles.actions}>
                        <Block className={styles.action} />
                        <Block className={styles.action} />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function DashboardTaskListSkeleton() {
    return (
        <div className={styles.taskList}>
            <div className={styles.date}>
                <div className={styles.lines}>
                    <Block className={styles.short} />
                    <Block className={styles.medium} />
                </div>
                <Block className={styles.button} />
            </div>
            {[0, 1, 2, 3].map((row) => (
                <div key={row} className={styles.taskRow}>
                    <Block className={styles.check} />
                    <div className={styles.taskText}>
                        <Block className={row % 2 ? styles.medium : styles.title} />
                        <Block className={styles.medium} />
                    </div>
                    <Block className={styles.check} />
                </div>
            ))}
            <Block className={styles.composer} />
        </div>
    );
}

export function PipelineSkeleton() {
    return (
        <div className={styles.pipeline}>
            <div className={styles.gauge}>
                <Block className={styles.arc} />
                <Block className={styles.gaugeValue} />
                <Block className={styles.gaugeLabel} />
            </div>
            <div className={styles.totals}>
                {[0, 1].map((item) => (
                    <div key={item} className={styles.lines}>
                        <Block className={styles.medium} />
                        <Block className={styles.title} />
                    </div>
                ))}
            </div>
            <div className={styles.stages}>
                {[0, 1, 2, 3].map((item) => (
                    <div key={item} className={styles.lines}>
                        <Block className={styles.title} />
                        <Block className={styles.medium} />
                    </div>
                ))}
            </div>
        </div>
    );
}

export function CommissionSkeleton() {
    return (
        <section className={commission.section}>
            <div className={commission.summary}>
                <div className={styles.lines}>
                    <Block className={styles.heading} />
                    <Block className={styles.amount} />
                    <Block className={styles.period} />
                </div>
                <div className={styles.lines}>
                    <Block className={styles.title} />
                    <Block className={styles.amount} />
                </div>
                <div className={styles.lines}>
                    <Block className={styles.title} />
                    <Block className={styles.title} />
                </div>
            </div>
            <div className={commission.detail}>
                <div className={styles.header}>
                    <Block className={styles.button} />
                    <Block className={styles.button} />
                </div>
                <div className={styles.chart}>
                    {[
                        styles.bar45,
                        styles.bar65,
                        styles.bar50,
                        styles.bar80,
                        styles.bar60,
                        styles.bar90,
                    ].map((barClass, index) => (
                        <div key={index} className={styles.chartColumn}>
                            <Block className={cn(styles.bar, barClass)} />
                            <Block className={styles.axisLabel} />
                        </div>
                    ))}
                </div>
                <div className={styles.legend}>
                    <Block className={styles.short} />
                    <Block className={styles.short} />
                </div>
            </div>
        </section>
    );
}

export function DashboardListingRowsSkeleton() {
    return (
        <div className={styles.listings}>
            <Block className={styles.tableHeader} />
            {[0, 1, 2].map((row) => (
                <div key={row} className={styles.listingRow}>
                    <div className={styles.listingProperty}>
                        <Block className={styles.photo} />
                        <div className={styles.lines}>
                            <Block className={styles.title} />
                            <Block className={styles.medium} />
                            <Block className={styles.short} />
                        </div>
                    </div>
                    <Block className={styles.listingPrice} />
                    <Block className={styles.listingClients} />
                    <Block className={styles.listingUpdated} />
                    <Block className={styles.listingActions} />
                </div>
            ))}
        </div>
    );
}

function UpdatesSkeleton() {
    return (
        <div className={styles.updates}>
            {[0, 1, 2].map((row) => (
                <div key={row} className={styles.update}>
                    <Block className={styles.check} />
                    <div className={styles.lines}>
                        <Block className={styles.title} />
                        <Block className={styles.medium} />
                    </div>
                    <Block className={styles.timestamp} />
                </div>
            ))}
        </div>
    );
}

export function DashboardSkeleton() {
    return (
        <LoadingState label="Loading your dashboard">
            <div className={cn(layout.dashboard, styles.page)}>
                <PageHeader
                    className={styles.pageHeader}
                    title="Dashboard"
                    summaryLines={[]}
                    summaryLoading
                >
                    <div className={styles.desktopMetadata}>
                        <div className={styles.metadataDetails}>
                            <div className={styles.metadataItem}>
                                <Block className={styles.metadataIcon} />
                                <Block className={styles.metadataTime} />
                            </div>
                            <div className={styles.metadataItem}>
                                <Block className={styles.metadataIcon} />
                                <Block className={styles.metadataArea} />
                            </div>
                            <div className={styles.metadataChips}>
                                {[0, 1, 2].map((id) => (
                                    <Block key={id} className={styles.metadataChip} />
                                ))}
                            </div>
                        </div>
                        <Block className={styles.quickAdd} />
                    </div>
                </PageHeader>
                <div className={layout.stats}>
                    {[0, 1, 2, 3].map((id) => (
                        <div key={id} className={layout.stat}>
                            <div className={cn(layout.statLink, styles.stat)}>
                                <Block className={styles.statIcon} />
                                <div className={cn(layout.statText, styles.statText)}>
                                    <Block className={styles.title} />
                                    <Block className={styles.medium} />
                                </div>
                                <Block className={styles.statValue} />
                            </div>
                        </div>
                    ))}
                </div>
                <div className={layout.workGrid}>
                    <div className={layout.nextVisit}>
                        <NextVisitSkeleton />
                    </div>
                    <div className={layout.visits}>
                        <section className={cn(styles.card, styles.workCard)}>
                            <CardHeader />
                            <Tabs />
                            <div className={styles.viewport}>
                                <DashboardVisitListSkeleton />
                            </div>
                            <Footer />
                        </section>
                    </div>
                    <div className={layout.tasks}>
                        <section className={cn(styles.card, styles.workCard)}>
                            <CardHeader />
                            <Tabs two />
                            <div className={styles.viewport}>
                                <DashboardTaskListSkeleton />
                            </div>
                            <Footer />
                        </section>
                    </div>
                    <div className={layout.pipeline}>
                        <section className={styles.card}>
                            <CardHeader />
                            <PipelineSkeleton />
                        </section>
                    </div>
                </div>
                <CommissionSkeleton />
                <div className={inventory.layout}>
                    <section className={cn(inventory.panel, inventory.listingsPanel)}>
                        <CardHeader />
                        <Tabs two />
                        <div className={styles.viewport}>
                            <DashboardListingRowsSkeleton />
                        </div>
                        <Footer />
                    </section>
                    <section className={inventory.panel}>
                        <CardHeader />
                        <UpdatesSkeleton />
                    </section>
                </div>
            </div>
        </LoadingState>
    );
}
