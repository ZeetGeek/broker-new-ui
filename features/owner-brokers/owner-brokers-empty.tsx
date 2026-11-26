import { ownerBrokersHref } from "@/lib/routes/owner";

import { EmptyStateAction } from "@/components/empty-state";
import { EmptyState } from "@/components/shared/empty-state";
import { Handshake, Search, UserRoundSearch } from "@/components/shared/icons";

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
                        <EmptyStateAction
                            label="Clear the search"
                            icon={Search}
                            onClick={onClearSearch}
                        />
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
                    <EmptyStateAction
                        label="Clear the search"
                        icon={Search}
                        onClick={onClearSearch}
                    />
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
            <EmptyStateAction
                label="Browse brokers"
                icon={Search}
                href={ownerBrokersHref("browse")}
            />
        </EmptyState>
    );
}
