export default function Loading() {
    return (
        <div className="flex flex-col gap-4 py-4">
            <div className="h-10 w-64 animate-pulse rounded-control bg-surface-muted" />
            <div className="h-72 animate-pulse rounded-card bg-surface-muted" />
            <div className="h-40 animate-pulse rounded-card bg-surface-muted" />
        </div>
    );
}
