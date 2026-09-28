"use client";

import { BadgeCheck, Send } from "lucide-react";

import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type { BrokerProfile } from "@/lib/api/representative";

function brokerLabel(broker: BrokerProfile): string {
    return (
        broker.displayName?.trim() ||
        broker.fullName?.trim() ||
        broker.orgName?.trim() ||
        "Broker"
    );
}

export function OwnerBrokerCard({
    broker,
    onInvite,
}: {
    broker: BrokerProfile;
    onInvite: (broker: BrokerProfile) => void;
}) {
    const name = brokerLabel(broker);
    const areas = broker.serviceAreas?.slice(0, 3).join(", ");

    return (
        <article
            className="
              flex flex-col gap-3 rounded-card border border-border-warm bg-surface p-4 shadow-sm
              sm:flex-row sm:items-center sm:justify-between
            "
        >
            <div className="flex items-center gap-3 min-inline-0">
                <UserAvatar
                    name={name}
                    imageUrl={broker.avatarUrl ?? undefined}
                    size="md"
                    className="shrink-0"
                />
                <div className="flex min-inline-0 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="body truncate font-semibold tracking-wide text-ink capitalize">
                            {name}
                        </p>
                        {broker.verified ? (
                            <Badge variant="brand">
                                <BadgeCheck aria-hidden />
                                Verified
                            </Badge>
                        ) : null}
                    </div>
                    {broker.orgName ? (
                        <p className="body-sm truncate text-ink-muted">{broker.orgName}</p>
                    ) : null}
                    <p className="body-xs text-ink-subtle">
                        {[broker.city, areas].filter(Boolean).join(" · ") || "—"}
                    </p>
                    {broker.rating ? (
                        <p className="body-xs text-ink-muted">
                            {broker.rating} rating
                            {broker.ratingCount ? ` (${broker.ratingCount})` : null}
                        </p>
                    ) : null}
                </div>
            </div>
            <Button size="md" onClick={() => onInvite(broker)} className="shrink-0">
                <Send aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
                Invite
            </Button>
        </article>
    );
}
