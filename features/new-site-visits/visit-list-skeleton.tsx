import { Skeleton } from "@/components/shared/skeleton";

import styles from "./visits.module.css";

/** Keep the visit toolbar mounted while its chronological rows are loading. */
export function VisitListSkeleton() {
    return (
        <div role="status" aria-busy="true" className={styles.groups}>
            <span className="sr-only">Finding your visits</span>
            <div aria-hidden="true">
                <div className={styles.groupHeading}>
                    <Skeleton className="block-4 inline-24" />
                </div>
                <div className={styles.list}>
                    {Array.from({ length: 5 }, (_, index) => (
                        <div key={index} className={styles.visitCard}>
                            <div className={styles.visitRow}>
                                <div className={styles.rowProperty}>
                                    <Skeleton className="shrink-0 block-16 inline-16" />
                                    <div className="flex flex-1 flex-col gap-2 min-inline-0">
                                        <Skeleton className="block-4 inline-4/5" />
                                        <Skeleton className="block-3 inline-3/5" />
                                    </div>
                                </div>
                                <div className={styles.rowTime}>
                                    <Skeleton className="shrink-0 block-9 inline-9" />
                                    <div className="flex flex-1 flex-col gap-2 min-inline-0">
                                        <Skeleton className="block-3 inline-3/4" />
                                        <Skeleton className="block-4 inline-full" />
                                    </div>
                                </div>
                                <div className={styles.rowProfiles}>
                                    {["owner", "client"].map((person) => (
                                        <div key={person} className={styles.rowClient}>
                                            <Skeleton className="shrink-0 rounded-full block-8 inline-8" />
                                            <div className="flex flex-1 flex-col gap-2 min-inline-0">
                                                <Skeleton className="block-3 inline-1/2" />
                                                <Skeleton className="block-4 inline-3/4" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <Skeleton className={`${styles.rowStatus} block-6 inline-20`} />
                                <div className={styles.rowActions}>
                                    <Skeleton className="block-8 inline-8" />
                                    <Skeleton className="block-8 inline-8" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
