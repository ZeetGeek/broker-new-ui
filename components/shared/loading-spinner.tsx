import { cn } from "@/lib/utils";

export function LoadingSpinner({
    label = "Loading",
    className,
}: {
    label?: string;
    className?: string;
}) {
    return (
        <div
            className={cn(
                `
                  animate-spin rounded-full border-2 border-border-warm border-bs-brand block-8
                  inline-8
                `,
                className,
            )}
            aria-label={label}
        />
    );
}

export function LoadingCenter({
    label = "Loading",
    className,
}: {
    label?: string;
    className?: string;
}) {
    return (
        <div className={cn("flex items-center justify-center min-block-64", className)}>
            <LoadingSpinner label={label} />
        </div>
    );
}
