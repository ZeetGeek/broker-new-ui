import { Skeleton } from "@/components/shared/skeleton";

import styles from "./property-detail.module.css";

export function PropertyDetailSkeleton({ isPublic = false }: { isPublic?: boolean }) {
    return (
        <div
            className={`${styles.page} ${styles.loadingPage} ${isPublic ? styles.publicPage : ""}`}
            data-property-detail
            role="status"
            aria-busy="true"
        >
            <span className="sr-only">Loading property details</span>
            <div aria-hidden>
                <header className={styles.header}>
                    <h1>
                        <Skeleton className={styles.skeletonHeading} />
                    </h1>
                    <div className={styles.locationLine}>
                        <div className={styles.propertyMeta}>
                            <Skeleton className="block-5 inline-52 max-inline-full" />
                            <Skeleton className="rounded-full block-5 inline-24" />
                            <Skeleton className="block-5 inline-28" />
                        </div>
                        <div className={styles.headerActions}>
                            <Skeleton className={styles.circleButton} />
                            {!isPublic ? <Skeleton className={styles.circleButton} /> : null}
                        </div>
                    </div>
                </header>
                <div className={styles.fullWidthGallery}>
                    <div className={styles.carouselViewport}>
                        <div className={styles.carouselTrack}>
                            {[0, 1, 2].map((i) => (
                                <div key={i} className={styles.carouselSlide}>
                                    <Skeleton className={styles.photo} />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className={styles.carouselFooter}>
                        <div className={styles.headerActions}>
                            <Skeleton className={styles.circleButton} />
                            <Skeleton className={styles.circleButton} />
                        </div>
                        <Skeleton className="rounded-full block-1.5 inline-full" />
                        <Skeleton className="justify-self-end rounded-full block-11 inline-16" />
                    </div>
                </div>
                <div className={styles.bodyGrid}>
                    <div className={styles.content}>
                        <div className={styles.overview}>
                            <Skeleton className="mbe-3 block-7 inline-3/4" />
                            <Skeleton className="block-4 inline-44" />
                            <div className={styles.highlights}>
                                {[0, 1, 2].map((i) => (
                                    <div className={styles.highlight} key={i}>
                                        <Skeleton className="mbe-2 block-6 inline-6" />
                                        <Skeleton className="mbe-1 block-5 inline-2/3" />
                                        <Skeleton className="block-4 inline-3/4" />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <section className={styles.section}>
                            <Skeleton className="mbe-5 block-6 inline-40" />
                            <div className={styles.skeletonLines}>
                                <Skeleton className="block-4 inline-full" />
                                <Skeleton className="block-4 inline-5/6" />
                                <Skeleton className="block-4 inline-2/3" />
                            </div>
                        </section>
                        <section className={styles.section}>
                            <Skeleton className="mbe-5 block-6 inline-32" />
                            <div className={styles.facts}>
                                {[0, 1, 2, 3, 4, 5].map((i) => (
                                    <div className={styles.skeletonLines} key={i}>
                                        <Skeleton className="block-4 inline-2/3" />
                                        <Skeleton className="block-5 inline-1/2" />
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                    <aside className={styles.rail}>
                        <div className={styles.actionCard}>
                            <div className={styles.skeletonLines}>
                                <Skeleton className="block-4 inline-24" />
                                <Skeleton className="block-9 inline-44" />
                                <Skeleton className="block-8 inline-32" />
                                <Skeleton className="block-4 inline-40" />
                            </div>
                            {!isPublic ? (
                                <div className={styles.section}>
                                    <Skeleton className="mbe-3 block-5 inline-5/6" />
                                    <Skeleton className="mbe-5 block-4 inline-full" />
                                    <Skeleton className="block-12 inline-full" />
                                </div>
                            ) : null}
                        </div>
                        <div className={styles.contact}>
                            <Skeleton className="mbe-5 block-5 inline-40" />
                            <div className={styles.contactIdentity}>
                                <Skeleton className="shrink-0 rounded-full block-10 inline-10" />
                                <div className={styles.skeletonLines}>
                                    <Skeleton className="block-4 inline-28" />
                                    <Skeleton className="block-4 inline-32" />
                                </div>
                            </div>
                            <Skeleton className="mbs-5 block-11 inline-full" />
                        </div>
                    </aside>
                </div>
            </div>
            {!isPublic ? (
                <div className={styles.mobileBar} aria-hidden>
                    <Skeleton className="block-8 inline-28" />
                    <Skeleton className="block-12 inline-40" />
                </div>
            ) : null}
        </div>
    );
}
