import { EmptyState } from "@/components/empty-state";
import { AlertCircle, RefreshCw } from "@/components/shared/icons";

/** A card's data failed to load: say what, and offer a retry. */
export function CardError({
    what,
    onRetry,
    retrying = false,
    className,
}: {
    /** Names the data, e.g. "your visits". */
    what: string;
    onRetry: () => void;
    retrying?: boolean;
    className?: string;
}) {
    return (
        <EmptyState
            size="card"
            variant="error"
            icon={AlertCircle}
            heading={`Could not load ${what}`}
            description="Check your connection and try again."
            className={className}
            action={{
                icon: RefreshCw,
                label: retrying ? "Trying again..." : "Try again",
                disabled: retrying,
                onClick: onRetry,
            }}
        />
    );
}
