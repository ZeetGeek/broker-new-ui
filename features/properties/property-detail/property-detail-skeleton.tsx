import { Skeleton } from "@/components/shared/skeleton";

import styles from "./property-detail.module.css";

export function PropertyDetailSkeleton() {
    return (
        <div className={styles.page} data-property-detail role="status" aria-busy="true">
            <span className="sr-only">Loading property details</span>
            <div aria-hidden>
                <div className={styles.topline}>
                    <Skeleton className="block-5 inline-32" />
                </div>
                <div className={styles.header}>
                    <Skeleton className="mbe-4 block-9 inline-3/4" />
                    <Skeleton className="block-4 inline-1/3" />
                </div>
                <div className={styles.photoGrid} data-count="5">
                    <Skeleton className="block-full inline-full" />
                    {[0, 1, 2, 3].map((i) => (
                        <Skeleton key={i} className="block-full inline-full" />
                    ))}
                </div>
                <div className={styles.bodyGrid}>
                    <div className={styles.content}>
                        <Skeleton className="mbe-5 block-7 inline-3/4" />
                        <Skeleton className="mbe-8 block-24 inline-full" />
                        <Skeleton className="block-48 inline-full" />
                    </div>
                    <div className={styles.rail}>
                        <Skeleton className="mbe-6 rounded-card block-80 inline-full" />
                        <Skeleton className="block-20 inline-full" />
                    </div>
                </div>
            </div>
        </div>
    );
}
