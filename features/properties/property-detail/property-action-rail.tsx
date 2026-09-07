"use client";

import Link from "next/link";

import { Eye, EyeOff, Inbox, Pencil, Trash2 } from "lucide-react";

import { brokerPropertyEditHref } from "@/lib/routes/broker";
import { cn } from "@/lib/utils";

import { PropertySharePopover } from "@/components/shared/property-share-popover";
import { Button } from "@/components/ui/button";

import { listedAgoLabel } from "@/features/properties/property-detail/property-detail-facts";
import type { MyListingItem } from "@/features/properties/your-listings/types";

export type PropertyActionRailProps = {
    item: MyListingItem;
    busy: boolean;
    onTogglePublish: () => void;
    onRequestDelete: () => void;
    shareListing: React.ComponentProps<typeof PropertySharePopover>["listing"];
};

/**
 * The rail answers one question: is this property working for me right now?
 * Publish state leads, inbound requests follow, edit and delete sit last.
 */
export function PropertyActionRail({
    item,
    busy,
    onTogglePublish,
    onRequestDelete,
    shareListing,
}: PropertyActionRailProps) {
    const isPublished = item.status === "published";

    // `self-start` matters: a stretched grid item cannot stick, and it leaves a
    // tall empty box under the last button.
    return (
        <aside className="flex flex-col gap-4 self-start lg:sticky lg:inset-bs-24">
            <div
                className={cn(
                    "flex flex-col gap-4 rounded-card border p-5",
                    isPublished
                        ? "border-brand/20 bg-brand-soft"
                        : "border-border-warm bg-surface-muted",
                )}
            >
                <div className="flex items-start gap-3">
                    <span
                        className={cn(
                            `
                              flex shrink-0 items-center justify-center rounded-full block-9
                              inline-9
                            `,
                            isPublished ? "bg-brand text-surface" : "bg-surface text-ink-muted",
                        )}
                    >
                        {isPublished ? (
                            <Eye aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
                        ) : (
                            <EyeOff aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
                        )}
                    </span>
                    <div className="flex flex-col gap-0.5 min-inline-0">
                        <p className="h6 text-ink">
                            {isPublished ? "Live to brokers" : "Not visible to brokers"}
                        </p>
                        <p className="body-sm text-ink-muted">
                            {isPublished
                                ? "Brokers can find this and ask to represent it."
                                : "Publish it so brokers can find it and send requests."}
                        </p>
                    </div>
                </div>

                <Button
                    type="button"
                    size="lg"
                    disabled={busy}
                    onClick={onTogglePublish}
                    className={cn(
                        "rounded-control inline-full",
                        isPublished
                            ? "border border-border-warm bg-surface text-ink hover:bg-surface-muted"
                            : "bg-brand text-surface hover:bg-brand-text",
                    )}
                >
                    {isPublished ? "Unpublish" : "Publish this property"}
                </Button>
            </div>

            <div
                className="
                  flex flex-col gap-4 rounded-card border border-border-warm bg-surface p-5
                "
            >
                <div className="flex items-center justify-between gap-3">
                    <span className="body-sm flex items-center gap-2 font-medium text-ink-muted">
                        <Inbox aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
                        Broker requests
                    </span>
                    <span className="h5 tabular font-semibold text-ink">
                        {item.inboundRequestCount}
                    </span>
                </div>

                <div
                    className="
                      body-sm flex items-center justify-between gap-3 border-bs border-border-warm
                      pbs-3 text-ink-muted
                    "
                >
                    <span>Listed</span>
                    <span className="font-medium text-ink">
                        {listedAgoLabel(item.listedDaysAgo)}
                    </span>
                </div>

                {item.photoCount > 0 ? (
                    <div className="body-sm flex items-center justify-between gap-3 text-ink-muted">
                        <span>Photos</span>
                        <span className="tabular font-medium text-ink">{item.photoCount}</span>
                    </div>
                ) : null}
            </div>

            <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        className="flex-1 border-border-warm"
                        render={<Link href={brokerPropertyEditHref(item.id)} />}
                    >
                        <Pencil aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
                        Edit
                    </Button>
                    <PropertySharePopover listing={shareListing} />
                </div>

                <Button
                    type="button"
                    variant="ghost"
                    disabled={busy}
                    onClick={onRequestDelete}
                    className="justify-start text-danger hover:bg-danger-soft hover:text-danger"
                >
                    <Trash2 aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
                    Delete property
                </Button>
            </div>
        </aside>
    );
}
