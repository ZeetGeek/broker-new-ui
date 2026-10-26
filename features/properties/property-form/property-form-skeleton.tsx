import { Skeleton } from "@/components/shared/skeleton";

function FormFieldSkeleton({ wide = false }: { wide?: boolean }) {
    return (
        <div className={wide ? "sm:col-span-2" : undefined}>
            <Skeleton className="mbe-2 block-3 inline-24" />
            <Skeleton className="block-11 inline-full" />
        </div>
    );
}

function FormSectionSkeleton() {
    return (
        <div>
            <Skeleton className="block-6 inline-44 max-inline-full" />
            <Skeleton className="mbs-2 block-3.5 inline-80 max-inline-full" />
            <div className="mbs-6 grid gap-4 sm:grid-cols-2">
                <FormFieldSkeleton />
                <FormFieldSkeleton />
                <FormFieldSkeleton wide />
            </div>
        </div>
    );
}

function DesktopStepRailSkeleton() {
    return (
        <aside
            className="
              hidden flex-col rounded-card bg-surface px-4 py-5 shadow-sm min-block-0
              xl:flex
            "
            aria-hidden
        >
            <div className="flex flex-1 flex-col gap-3 min-block-0">
                {Array.from({ length: 5 }, (_, index) => (
                    <div key={index} className="flex items-center gap-3 px-3 min-block-12">
                        <Skeleton className="shrink-0 rounded-full block-7 inline-7" />
                        <Skeleton className="block-3.5 inline-28" />
                    </div>
                ))}
            </div>
            <div className="shrink-0 border-bs border-border-warm pbs-5">
                <Skeleton className="mx-auto block-3 inline-20" />
                <Skeleton className="mbs-2 block-1.5 inline-full" />
                <Skeleton className="mbs-4 block-11 inline-full" />
                <Skeleton className="block-11 inline-full" />
            </div>
        </aside>
    );
}

function DesktopSummarySkeleton() {
    return (
        <aside
            className="hidden overflow-hidden bg-surface-muted min-block-0 min-inline-0 xl:block"
            aria-hidden
        >
            <div className="flex flex-col gap-4">
                <div className="rounded-card bg-surface p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                        <Skeleton className="block-3 inline-24" />
                        <Skeleton className="rounded-full block-5 inline-14" />
                    </div>
                    <Skeleton className="mbs-4 aspect-4/3 inline-full" />
                    <Skeleton className="mbs-4 block-7 inline-24" />
                    <Skeleton className="mbs-2 block-4 inline-4/5" />
                    <Skeleton className="block-3 inline-2/5" />
                    <div className="mbs-4 grid grid-cols-3 gap-3 border-bs border-border-warm pbs-4">
                        <Skeleton className="block-8 inline-full" />
                        <Skeleton className="block-8 inline-full" />
                        <Skeleton className="block-8 inline-full" />
                    </div>
                </div>
                <div className="rounded-card bg-surface p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                        <Skeleton className="block-4 inline-24" />
                        <Skeleton className="block-6 inline-12" />
                    </div>
                    <Skeleton className="mbs-3 block-1.5 inline-full" />
                    <Skeleton className="mbs-3 block-3 inline-4/5" />
                    <Skeleton className="block-11 inline-full" />
                </div>
            </div>
        </aside>
    );
}

/**
 * Dimension-matched first paint for local draft recovery. Keeping the modal shell
 * stable prevents the default draft from flashing before the saved step and values load.
 */
export function PropertyFormSkeleton() {
    return (
        <div
            role="status"
            aria-label="Loading saved property draft"
            className="flex flex-1 flex-col overflow-hidden min-block-0"
        >
            <span className="sr-only">Loading saved property draft…</span>
            <div className="shrink-0 border-be border-border-warm bg-surface xl:hidden">
                <div className="flex gap-2 overflow-hidden px-4 py-2" aria-hidden>
                    <Skeleton className="shrink-0 block-9 inline-24" />
                    <Skeleton className="shrink-0 block-9 inline-24" />
                    <Skeleton className="shrink-0 block-9 inline-24" />
                </div>
                <div
                    className="
                      flex items-center justify-between gap-3 border-bs border-border-warm px-4
                      min-block-11
                    "
                    aria-hidden
                >
                    <div className="flex items-center gap-2">
                        <Skeleton className="rounded-full block-7 inline-7" />
                        <Skeleton className="block-3 inline-20" />
                    </div>
                    <Skeleton className="block-3 inline-28" />
                </div>
            </div>
            <div
                className="
                  grid flex-1 gap-4 bg-surface-muted p-4 min-block-0
                  xl:grid-cols-[256px_minmax(0,1fr)_320px]
                "
            >
                <DesktopStepRailSkeleton />
                <main className="overflow-hidden bg-surface-muted min-block-0 min-inline-0">
                    <div
                        className="
                          rounded-card border border-border-warm bg-surface p-5 shadow-sm
                          min-block-full
                          sm:p-6
                          xl:p-7
                        "
                        aria-hidden
                    >
                        <FormSectionSkeleton />
                        <div className="mbs-6 border-bs border-border-warm pbs-6">
                            <FormSectionSkeleton />
                        </div>
                    </div>
                </main>
                <DesktopSummarySkeleton />
            </div>
        </div>
    );
}
