import Link from "next/link";

import { Inbox, Mail } from "lucide-react";

import { ownerBrokersHref } from "@/lib/routes/owner";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

import type { OwnerRequestsTab } from "@/features/owner-requests/types";

export function OwnerRequestsEmpty({ tab }: { tab: OwnerRequestsTab }) {
    if (tab === "requests") {
        return (
            <EmptyState
                icon={Inbox}
                heading="No pending requests"
                description="When a broker asks to sell your property, it shows up here."
            >
                <Button
                    size="lg"
                    variant="accent"
                    nativeButton={false}
                    render={<Link href={ownerBrokersHref()} />}
                >
                    Browse brokers
                </Button>
            </EmptyState>
        );
    }

    if (tab === "invitations") {
        return (
            <EmptyState
                icon={Mail}
                heading="No open invitations"
                description="Invite a broker from Browse when you want someone specific on a listing."
            >
                <Button
                    size="lg"
                    variant="accent"
                    nativeButton={false}
                    render={<Link href={ownerBrokersHref()} />}
                >
                    Browse brokers
                </Button>
            </EmptyState>
        );
    }

    return null;
}

export function OwnerRequestsFilteredEmpty({
    onClearFilters,
    searchQuery,
}: {
    onClearFilters?: () => void;
    searchQuery?: string;
}) {
    return (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
            <p className="h6 text-ink">Nothing matches what you picked</p>
            <p className="body-sm max-w-prose text-ink-muted">
                {searchQuery?.trim()
                    ? `No results for "${searchQuery.trim()}". Try clearing the search.`
                    : "Try another option above, or clear it to see every request."}
            </p>
            {onClearFilters ? (
                <button
                    type="button"
                    onClick={onClearFilters}
                    className="body-sm font-semibold text-brand underline-offset-4 hover:underline"
                >
                    Clear search
                </button>
            ) : null}
        </div>
    );
}
