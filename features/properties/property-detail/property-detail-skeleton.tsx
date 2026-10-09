const SHIMMER = "animate-pulse rounded-inner bg-surface-muted";

/** Mirrors the real layout so the page does not jump when data lands. */
export function PropertyDetailSkeleton() {
    return (
        <div className="flex flex-col gap-6 pbe-8">
            <div className={`${SHIMMER} block-5 inline-32`} />

            <div className="grid gap-2 md:grid-cols-4 md:grid-rows-2 md:block-104 lg:block-120">
                <div
                    className={`${SHIMMER}
                      aspect-4/3 rounded-card
                      md:col-span-2 md:row-span-2 md:aspect-auto
                    `}
                />
                {[0, 1, 2, 3].map((index) => (
                    <div key={index} className={`${SHIMMER} hidden md:block`} />
                ))}
            </div>

            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(18rem,1fr)] lg:gap-10">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col gap-3">
                        <div className={`${SHIMMER} block-8 inline-3/4`} />
                        <div className={`${SHIMMER} block-4 inline-1/2`} />
                    </div>
                    <div className={`${SHIMMER} rounded-card block-32`} />
                    <div className={`${SHIMMER} rounded-card block-48`} />
                    <div className={`${SHIMMER} block-24`} />
                </div>

                <div className="flex flex-col gap-4">
                    <div className={`${SHIMMER} rounded-card block-44`} />
                    <div className={`${SHIMMER} rounded-card block-32`} />
                </div>
            </div>
        </div>
    );
}
