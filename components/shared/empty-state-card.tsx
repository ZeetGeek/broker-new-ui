import { EmptyState, type EmptyStateProps } from "@/components/empty-state";

/** Full list surface with the compact empty-state design used by My Listings. */
export function EmptyStateCard(props: Omit<EmptyStateProps, "size">) {
    return (
        <div className="flex items-center rounded-card border border-border-warm bg-surface p-3 inline-full min-block-80 min-inline-0 sm:p-4 sm:min-block-96 lg:p-6 lg:min-block-[max(25rem,calc(100dvh-17rem))]">
            <EmptyState {...props} size="card" />
        </div>
    );
}
