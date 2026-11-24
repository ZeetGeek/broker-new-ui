import { Skeleton } from "@/components/shared/skeleton";

import styles from "./analytics.module.css";

const CARD =
    "flex flex-col gap-4 rounded-card bg-surface p-4 shadow-sm ring-1 ring-border-warm/50 sm:p-5";

function CardSkeleton({ rows }: { rows: number }) {
    return (
        <div className={CARD}>
            <Skeleton className="block-6 inline-40" />
            {Array.from({ length: rows }, (_, index) => (
                <div key={index} className="flex flex-col gap-2">
                    <Skeleton className="block-4 inline-32" />
                    <Skeleton className="rounded-full block-2 inline-full" />
                </div>
            ))}
        </div>
    );
}

export function AnalyticsSkeleton() {
    return (
        <div role="status" aria-label="Loading property performance" className={styles.report}>
            <div className="flex flex-col gap-2">
                <Skeleton className="block-8 inline-64" />
                <Skeleton className="block-4 inline-48" />
            </div>
            <div className={styles.workspace}>
                <div className={styles.main}>
                    <div className={styles.stats}>
                        {Array.from({ length: 4 }, (_, index) => (
                            <div key={index} className={CARD}>
                                <Skeleton className="block-4 inline-20" />
                                <Skeleton className="block-8 inline-16" />
                                <Skeleton className="block-4 inline-24" />
                            </div>
                        ))}
                    </div>
                    <CardSkeleton rows={1} />
                    <CardSkeleton rows={4} />
                    <CardSkeleton rows={2} />
                    <CardSkeleton rows={2} />
                </div>
                <div className={styles.aside}>
                    <Skeleton className="rounded-card block-64" />
                    <CardSkeleton rows={1} />
                </div>
            </div>
        </div>
    );
}
