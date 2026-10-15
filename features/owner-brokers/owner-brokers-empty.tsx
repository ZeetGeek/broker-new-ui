import { Handshake, Search, UserRoundSearch } from "lucide-react";
import Link from "next/link";

import { ownerBrokersHref } from "@/lib/routes/owner";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

import type { OwnerBrokersTab } from "@/features/owner-brokers/types";

export function OwnerBrokersEmpty({
    tab,
    hasSearch = false,
    onClearSearch,
}: {
    tab: OwnerBrokersTab;
    hasSearch?: boolean;
    onClearSearch?: () => void;
}) {
    if (tab === "browse") {
        if (hasSearch) {
            return (
                <EmptyState
                    icon={Search}
                    heading="Nothing matches"
                    description="Try a different name, agency, or area."
                    className="py-16"
                >
                    {onClearSearch ? (
                        <Button variant="secondary" size="sm" onClick={onClearSearch}>
                            Clear the search
                        </Button>
                    ) : null}
                </EmptyState>
            );
        }

        return (
            <EmptyState
                icon={UserRoundSearch}
                heading="No brokers yet"
                description="When brokers join your city, they’ll show up here so you can invite them."
                className="py-16"
            />
        );
    }

    if (hasSearch) {
        return (
            <EmptyState
                icon={Search}
                heading="Nothing matches"
                description="Try a different name or property."
                className="py-16"
            >
                {onClearSearch ? (
                    <Button variant="secondary" size="sm" onClick={onClearSearch}>
                        Clear the search
                    </Button>
                ) : null}
            </EmptyState>
        );
    }

    return (
        <EmptyState
            icon={Handshake}
            heading="No brokers yet"
            description="When a broker accepts your invite — or you approve their request — they show up here."
            className="py-16"
        >
            <Button
                size="lg"
                variant="accent"
                nativeButton={false}
                render={<Link href={ownerBrokersHref("browse")} />}
            >
                Browse brokers
            </Button>
        </EmptyState>
    );
}
