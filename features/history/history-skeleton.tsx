import { cn } from "@/lib/utils";

import { Skeleton } from "@/components/shared/skeleton";

import styles from "./history.module.css";

function Bone({ className }: { className: string }) {
    return <Skeleton className={cn("animate-none", className)} />;
}

/** Match the real rows so loading, searching and pagination keep the same rhythm. */
export function HistoryResultsSkeleton({
    label = "Loading history",
    rows = 5,
    readStatus = false,
}: {
    label?: string;
    rows?: number;
    readStatus?: boolean;
}) {
    return (
        <div role="status" aria-busy="true" className="motion-safe:animate-pulse">
            <span className="sr-only">{label}</span>
            <div aria-hidden="true">
                <div className={styles.groupHeading}>
                    <Bone className="block-3 inline-24" />
                    <Bone className="block-3 inline-20" />
                </div>
                <div className={styles.list}>
                    {Array.from({ length: rows }, (_, index) => (
                        <div key={index} className={styles.row}>
                            <div className={styles.subject}>
                                <Bone className="shrink-0 rounded-inner block-11 inline-11" />
                                <div className={`${styles.copy} inline-full`}>
                                    <Bone
                                        className={`block-4 ${index % 2 ? "inline-2/5" : "inline-3/5"}`}
                                    />
                                    <Bone
                                        className={`block-3.5 ${index % 2 ? "inline-4/5" : "inline-3/4"}`}
                                    />
                                </div>
                            </div>
                            <div className={styles.when}>
                                <Bone className="block-3 inline-20 max-inline-full" />
                                <Bone className="block-3 inline-16 max-inline-full" />
                            </div>
                            <div className={styles.badge}>
                                <Bone className="rounded-full block-6 inline-16 max-inline-full" />
                            </div>
                            <div className={styles.actions}>
                                {readStatus ? (
                                    <Bone className="block-8 inline-24 max-inline-full" />
                                ) : null}
                                <Bone className="block-8 inline-20 max-inline-full" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
