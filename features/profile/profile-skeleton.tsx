/** Shared card shell for every block below; only the height differs. */
const CARD_SKELETON = "animate-pulse rounded-card border border-border-warm bg-surface";

/**
 * Mirrors the real layout — headline, form panel + listing-style stats rail —
 * so nothing reflows when the profile lands. See docs/LOADING.md.
 */
export function ProfileSkeleton() {
    return (
        <div className="flex flex-col gap-4 lg:gap-5" aria-busy aria-label="Loading your profile">
            <div className="flex flex-col gap-2">
                <div className="animate-pulse rounded-sm bg-surface-muted block-8 inline-72" />
                <div className="animate-pulse rounded-sm bg-surface-muted block-4 inline-56" />
            </div>

            <div
                className="
                  grid items-start gap-5
                  lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-6
                  xl:grid-cols-[minmax(0,1fr)_20rem] xl:gap-8
                "
            >
                <div className={`${CARD_SKELETON} shadow-sm order-2 block-160 lg:order-1`} />

                <div className="flex flex-col gap-3 order-1 lg:order-2">
                    <div className={`${CARD_SKELETON} block-56`} />
                    <div
                        className="
                          animate-pulse rounded-card border border-dashed border-brand/20
                          bg-brand-soft/20 block-24
                        "
                    />
                </div>
            </div>
        </div>
    );
}
