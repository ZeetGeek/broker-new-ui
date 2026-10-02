import { Handshake, UserRoundSearch } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";

import type { OwnerBrokersTab } from "@/features/owner-brokers/types";

export function OwnerBrokersEmpty({ tab }: { tab: OwnerBrokersTab }) {
    if (tab === "browse") {
        return (
            <EmptyState
                icon={UserRoundSearch}
                heading="No brokers match your search"
                description="Try a different name, agency, or city."
            />
        );
    }

    return (
        <EmptyState
            icon={Handshake}
            heading="No active brokers yet"
            description="Accepted representations will show up here."
        />
    );
}
