"use client";

import { cn } from "@/lib/utils";

import { ContactName } from "@/components/shared/contact-name";
import { List } from "@/components/shared/icons";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { stageTitle } from "@/features/pipeline/stage-history";
import { DEAL_STAGE_META } from "@/features/pipeline/stage-meta";
import type { DealStage } from "@/features/pipeline/types";

function stageChipClass(stage?: string | null) {
    const key = stage === "site_visit" ? "visit" : stage;
    return key && Object.prototype.hasOwnProperty.call(DEAL_STAGE_META, key)
        ? DEAL_STAGE_META[key as DealStage].pillClass
        : undefined;
}

export function ClientPipelineInfo({
    clients,
    className,
}: {
    clients: Array<{ id: string; name: string; stage?: string | null }>;
    className?: string;
}) {
    return (
        <Popover>
            <PopoverTrigger
                aria-label="View client pipeline stages"
                onClick={(event) => event.stopPropagation()}
                className={cn(
                    "touch-target z-10 flex items-center justify-center rounded-control text-brand-text transition-colors duration-160 hover:bg-brand-soft/30 focus-visible:outline-2 focus-visible:outline-ring",
                    className,
                )}
            >
                <List aria-hidden className="block-4 inline-4" />
            </PopoverTrigger>
            <PopoverContent
                align="start"
                className="inline-60 max-inline-[calc(100vw-2rem)]"
                onClick={(event) => event.stopPropagation()}
            >
                <h3 className="body-sm font-semibold text-ink">Client pipeline stages</h3>
                {clients.length ? (
                    <ul className="flex flex-col gap-3 overflow-y-auto max-block-72">
                        {clients.map((client) => (
                            <li key={client.id} className="flex items-center gap-2 min-inline-0">
                                <UserAvatar name={client.name} size="2xs" />
                                <ContactName
                                    name={client.name}
                                    contactId={client.id}
                                    contactType="buyer"
                                    className="body-sm flex-1 wrap-anywhere min-inline-0"
                                />
                                <Badge
                                    color="stone"
                                    className={cn(
                                        "px-2 py-0.5 [--badge-dot:currentColor]",
                                        stageChipClass(client.stage),
                                    )}
                                >
                                    {client.stage ? stageTitle(client.stage) : "Stage unavailable"}
                                </Badge>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="body-sm text-ink-muted">No clients linked yet.</p>
                )}
            </PopoverContent>
        </Popover>
    );
}
