import { cn } from "@/lib/utils";

/** Decorative placeholder. Its parent owns the single accessible loading announcement. */
export function Skeleton({ className }: { className?: string }) {
    return (
        <span
            aria-hidden
            className={cn(
                "block animate-pulse rounded-control bg-surface-muted motion-reduce:animate-none",
                className,
            )}
        />
    );
}
