/** Shared card shell for every block below; only the height differs. */
const CARD_SKELETON = "animate-pulse rounded-card border border-border-warm bg-surface shadow-sm";

/**
 * Mirrors the real layout — headline, form panel + stats rail — so nothing
 * reflows when the profile lands. See docs/LOADING.md.
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
                <div className={`${CARD_SKELETON} order-2 block-160 lg:order-1`} />

                <div className={`${CARD_SKELETON} order-1 block-72 lg:order-2`} />
            </div>
        </div>
    );
}
