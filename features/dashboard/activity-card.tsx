import Link from "next/link";

import { Activity } from "lucide-react";

import { cn } from "@/lib/utils";

import { EmptyState } from "@/components/shared/empty-state";
import { TextLinkButton } from "@/components/shared/text-link-button";

import { CardLabel } from "./card-label";
import { DASHBOARD_CARD_SHELL } from "./card-shell";

const ACTIVITY_INFO = "Recent updates across your properties, clients, and visits.";

export type ActivityItem = {
    id: string;
    title: string;
    detail?: string | null;
    whenLabel: string;
    href?: string | null;
    category?: string;
};

export type ActivityData = {
    items: ActivityItem[];
    remainingCount?: number;
};

export type ActivityCardProps = {
    data: ActivityData;
    className?: string;
};

function EmptyActivity() {
    return (
        <EmptyState
            icon={Activity}
            heading="Nothing yet"
            description="Owner approvals, views, and updates will appear here."
        />
    );
}

function ActivityRow({ item }: { item: ActivityItem }) {
    const content = (
        <>
            <span aria-hidden className="mbs-1.5 shrink-0 rounded-full bg-brand block-2 inline-2" />
            <div className="flex-1 min-inline-0">
                <p className="body truncate font-medium text-ink">{item.title}</p>
                {item.detail ? (
                    <p className="body-sm mbs-0.5 truncate text-ink-muted">{item.detail}</p>
                ) : null}
            </div>
            <span className="body-xs shrink-0 font-medium text-ink-muted">{item.whenLabel}</span>
        </>
    );

    if (item.href) {
        return (
            <li>
                <Link
                    href={item.href}
                    className="
                      flex items-start gap-3 py-3 outline-none
                      hover:opacity-90
                      focus-visible:ring-3 focus-visible:ring-ring/30
                    "
                >
                    {content}
                </Link>
            </li>
        );
    }

    return <li className="flex items-start gap-3 py-3">{content}</li>;
}

export function ActivityCard({ data, className }: ActivityCardProps) {
    const items = data.items.slice(0, 6);
    const isEmpty = items.length === 0;
    const showFade = items.length >= 4 || (data.remainingCount ?? 0) > 0;

    return (
        <section
            className={cn(DASHBOARD_CARD_SHELL, className)}
            aria-labelledby="activity-card-heading"
        >
            <CardLabel info={ACTIVITY_INFO}>
                <span id="activity-card-heading">Activity</span>
            </CardLabel>

            {isEmpty ? (
                <EmptyActivity />
            ) : (
                <div className="relative mbs-2 flex-1 min-block-0">
                    <div
                        className="
                          absolute inset-0 scrollbar-none overflow-y-auto overscroll-contain
                          [-ms-overflow-style:none]
                          [&::-webkit-scrollbar]:hidden
                        "
                    >
                        <ul
                            className={cn(
                                "flex flex-col divide-y divide-border-warm",
                                showFade && "pbe-7",
                            )}
                        >
                            {items.map((item) => (
                                <ActivityRow key={item.id} item={item} />
                            ))}
                        </ul>
                    </div>

                    <div
                        className="
                          absolute inset-x-0 inset-be-0 z-10 flex flex-col justify-end block-14
                        "
                    >
                        {showFade ? (
                            <div
                                aria-hidden
                                className={`
                                  pointer-events-none absolute inset-0 bg-linear-to-t from-surface
                                  from-40% via-surface/90 to-transparent
                                `}
                            />
                        ) : null}
                        <div className="relative flex justify-center">
                            <TextLinkButton href="/broker/notifications">
                                View all activity
                            </TextLinkButton>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
