import { Skeleton } from "@/components/shared/skeleton";

import styles from "./planner.module.css";

/** Planner-shaped placeholders belong below the live task controls. */
export function TaskResultsSkeleton() {
    return (
        <div role="status" aria-busy="true" className={styles.planner}>
            <span className="sr-only">Finding your tasks</span>
            <div aria-hidden="true">
                <div className={styles.plannerNav}>
                    <Skeleton className="self-center block-4 inline-28 max-inline-full" />
                </div>
                <div className="grid grid-cols-1 gap-8 p-4 sm:grid-cols-3 xl:grid-cols-5">
                    {Array.from({ length: 5 }, (_, index) => (
                        <div
                            key={index}
                            className={
                                index === 0
                                    ? "min-inline-0"
                                    : index < 3
                                      ? "hidden min-inline-0 sm:block"
                                      : "hidden min-inline-0 xl:block"
                            }
                        >
                            <div className={styles.dayHeading}>
                                <Skeleton className="mbe-2 block-3 inline-12" />
                                <Skeleton className="block-5 inline-24 max-inline-full" />
                            </div>
                            <div className={styles.ruledList}>
                                {Array.from({ length: 10 }, (_, row) => (
                                    <div
                                        key={row}
                                        className={`${styles.blankLine} flex items-center px-2`}
                                    >
                                        {row < 4 ? (
                                            <Skeleton
                                                className={
                                                    row % 2
                                                        ? "block-3 inline-1/2"
                                                        : "block-3 inline-4/5"
                                                }
                                            />
                                        ) : null}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
