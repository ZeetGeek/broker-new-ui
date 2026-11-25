"use client";

import { type ReactNode, useState } from "react";

import { cn } from "@/lib/utils";
import { useMobileMenu } from "@/hooks/use-mobile-menu";

import { ContactName } from "@/components/shared/contact-name";
import { List } from "@/components/shared/icons";
import { MobileActionDrawer } from "@/components/shared/mobile-action-drawer";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { stageTitle } from "@/features/pipeline/stage-history";
import { DEAL_STAGE_META } from "@/features/pipeline/stage-meta";
import type { DealStage } from "@/features/pipeline/types";

import styles from "./client-pipeline-info.module.css";

function stageChipClass(stage?: string | null) {
    const key = stage === "site_visit" ? "visit" : stage;
    return key && Object.prototype.hasOwnProperty.call(DEAL_STAGE_META, key)
        ? DEAL_STAGE_META[key as DealStage].pillClass
        : undefined;
}

type PipelineClient = {
    id: string;
    contactId?: string | null;
    name: string;
    stage?: string | null;
};

function PipelineClientList({
    clients,
    emptyMessage,
    mobile = false,
}: {
    clients: PipelineClient[];
    emptyMessage: string;
    mobile?: boolean;
}) {
    if (!clients.length) {
        return <p className="body-sm text-ink-muted">{emptyMessage}</p>;
    }

    return (
        <ul
            className={cn(
                "flex flex-col",
                mobile ? styles.drawerList : "gap-3 overflow-y-auto max-block-72",
            )}
        >
            {clients.map((client) => (
                <li
                    key={client.id}
                    className={cn(
                        "flex items-center gap-2 min-inline-0",
                        mobile && styles.drawerItem,
                    )}
                >
                    <UserAvatar name={client.name} size="2xs" />
                    <ContactName
                        name={client.name}
                        contactId={client.contactId === undefined ? client.id : client.contactId}
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
    );
}

export function ClientPipelineInfo({
    clients,
    className,
    children,
    triggerLabel = "View client pipeline stages",
    heading = "Client pipeline stages",
    openOnHover = false,
    enabled = true,
    emptyMessage = "No clients linked yet.",
}: {
    clients: PipelineClient[];
    className?: string;
    children?: ReactNode;
    triggerLabel?: string;
    heading?: string;
    openOnHover?: boolean;
    enabled?: boolean;
    emptyMessage?: string;
}) {
    const mobile = useMobileMenu();
    const [open, setOpen] = useState(false);

    if (!enabled) {
        return <span className={className}>{children}</span>;
    }

    if (mobile) {
        return (
            <MobileActionDrawer
                open={open}
                onOpenChange={setOpen}
                title={heading}
                trigger={
                    <button
                        type="button"
                        aria-label={triggerLabel}
                        onClick={(event) => event.stopPropagation()}
                        className={cn(
                            "touch-target z-10 flex items-center justify-center rounded-control text-brand-text transition-colors duration-160 hover:bg-brand-soft/30 focus-visible:outline-2 focus-visible:outline-ring",
                            className,
                        )}
                    >
                        {children ?? <List aria-hidden className="block-4 inline-4" />}
                    </button>
                }
            >
                <PipelineClientList clients={clients} emptyMessage={emptyMessage} mobile />
            </MobileActionDrawer>
        );
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger
                aria-label={triggerLabel}
                openOnHover={openOnHover}
                closeDelay={150}
                onClick={(event) => event.stopPropagation()}
                className={cn(
                    "touch-target z-10 flex items-center justify-center rounded-control text-brand-text transition-colors duration-160 hover:bg-brand-soft/30 focus-visible:outline-2 focus-visible:outline-ring",
                    className,
                )}
            >
                {children ?? <List aria-hidden className="block-4 inline-4" />}
            </PopoverTrigger>
            <PopoverContent
                align="start"
                className="inline-max max-inline-[calc(100dvw-2rem)]"
                onClick={(event) => event.stopPropagation()}
            >
                <h3 className="body-sm font-semibold text-ink">{heading}</h3>
                <PipelineClientList clients={clients} emptyMessage={emptyMessage} />
            </PopoverContent>
        </Popover>
    );
}
