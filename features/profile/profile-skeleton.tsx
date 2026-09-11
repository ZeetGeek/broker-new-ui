/** Shared card shell for every block below; only the height differs. */
const CARD_SKELETON = "animate-pulse rounded-card border border-border-warm bg-surface";

/**
 * Mirrors the real layout — headline, four stat tiles, the photo band, then
 * two field cards — so nothing reflows when the profile lands.
 * See docs/LOADING.md.
 */
export function ProfileSkeleton() {
    return (
        <div className="flex flex-col gap-6" aria-busy aria-label="Loading your profile">
            <div className="flex flex-col gap-2">
                <div className="animate-pulse rounded-sm bg-surface-muted block-8 inline-72" />
                <div className="animate-pulse rounded-sm bg-surface-muted block-4 inline-56" />
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {Array.from({ length: 4 }, (_, index) => (
                    <div key={index} className={`${CARD_SKELETON} block-24`} />
                ))}
            </div>

            <div className={`${CARD_SKELETON} block-32`} />

            {Array.from({ length: 2 }, (_, index) => (
                <div key={index} className={`${CARD_SKELETON} block-64`} />
            ))}
        </div>
    );
}
