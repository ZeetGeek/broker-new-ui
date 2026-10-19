"use client";

import type { ReactNode } from "react";

import { addCollection, Icon } from "@iconify/react/offline";

import { cn } from "@/lib/utils";

import { AvatarStack } from "@/components/shared/avatar-stack";
import {
    OVERLAY_GLASS_BUTTON_CLASS,
    OVERLAY_PERSON_ACTION_CLASS,
    OVERLAY_PERSON_LABEL_CLASS,
} from "@/components/shared/overlay-card";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import tablerContactIcons from "@/features/properties/my-requests/tabler-contact.json";

addCollection(tablerContactIcons as Parameters<typeof addCollection>[0]);

type AttachedPerson = { id: string; name: string; avatarUrl?: string };

type PartyMeetSide = {
    name: string;
    avatarUrl?: string;
    /** Screen-reader role, e.g. "Owner" / "Buyer" / "Broker". */
    role: string;
    onOpen?: () => void;
};

/**
 * Owner/broker + buyer in one glass strip — two equal halves split by a
 * center divider. Name on top, role under it. Used on pipeline and owner-lead
 * cards so both portals read a deal the same way.
 */
export function PartyMeetRow({ left, right }: { left: PartyMeetSide; right: PartyMeetSide }) {
    const ariaLabel = `${left.role} ${left.name}, ${right.role} ${right.name}`;

    return (
        <div
            role="group"
            aria-label={ariaLabel}
            className={cn(
                "flex items-stretch rounded-control inline-full",
                OVERLAY_GLASS_BUTTON_CLASS,
            )}
        >
            <PartyMeetPerson side={left} />
            <div
                aria-hidden
                className="mbs-2.5 mbe-2.5 shrink-0 self-stretch bg-border-warm inline-px"
            />
            <PartyMeetPerson side={right} />
        </div>
    );
}

function PartyMeetPerson({ side }: { side: PartyMeetSide }) {
    const content = (
        <>
            <UserAvatar name={side.name} imageUrl={side.avatarUrl} size="xs" className="shrink-0" />
            <span className="flex min-inline-0 flex-col gap-0.5 text-start">
                <span className="body-sm truncate font-semibold tracking-wide text-ink capitalize">
                    {side.name}
                </span>
                <span className="body-xs truncate text-ink-muted">{side.role}</span>
            </span>
        </>
    );

    const className = "flex min-inline-0 flex-1 items-center gap-2.5 px-3 py-2.5";

    if (side.onOpen) {
        return (
            <button
                type="button"
                onClick={side.onOpen}
                className={cn(
                    className,
                    `
                      transition-colors duration-160
                      hover:bg-surface-muted
                      focus-visible:outline-2 focus-visible:outline-offset-[-2px]
                      focus-visible:outline-ring
                    `,
                )}
            >
                {content}
            </button>
        );
    }

    return <div className={className}>{content}</div>;
}

function AttachedPeopleShell({
    people,
    title,
    onManage,
}: {
    people: AttachedPerson[];
    title: ReactNode;
    onManage?: () => void;
}) {
    const names = people.map((person) => person.name).join(", ");

    const content = (
        <>
            <AvatarStack people={people} max={3} className="shrink-0" />
            <span className="flex min-inline-0 flex-col gap-0.5">
                <span className="body-sm font-semibold tracking-wide text-ink">{title}</span>
                <span className="body-xs truncate tracking-wide text-ink-muted capitalize">
                    {names}
                </span>
            </span>
        </>
    );

    if (onManage) {
        return (
            <button
                type="button"
                onClick={onManage}
                className={cn(
                    `
                      flex items-center gap-2.5 px-3 py-2.5 text-start transition-colors
                      duration-160 inline-full rounded-control
                    `,
                    OVERLAY_GLASS_BUTTON_CLASS,
                )}
            >
                {content}
            </button>
        );
    }

    return (
        <div
            className={cn(
                "flex items-center gap-2.5 px-3 py-2.5 rounded-control",
                OVERLAY_GLASS_BUTTON_CLASS,
            )}
        >
            {content}
        </div>
    );
}

/** Attached buyers — same quiet label layout as Owner, with an Add buyer control. */
export function AttachedBuyersRow({
    buyers,
    onManage,
}: {
    buyers: AttachedPerson[];
    onManage?: () => void;
}) {
    if (buyers.length === 0) return null;

    const title = buyers.length === 1 ? "1 buyer" : `${buyers.length} buyers`;

    return (
        <div className="body-sm flex items-center gap-2 tracking-wide text-ink-muted inline-full min-inline-0">
            <span className={OVERLAY_PERSON_LABEL_CLASS}>Buyers</span>
            <span className="flex min-inline-0 flex-1 items-center gap-1.5">
                <AvatarStack people={buyers} size="2xs" max={3} className="shrink-0" />
                <span className="truncate font-semibold text-ink">{title}</span>
            </span>
            {onManage ? (
                <span className={OVERLAY_PERSON_ACTION_CLASS}>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger
                                render={
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="link"
                                        className="
                                          block-auto! min-block-0 gap-1 px-0 py-0
                                          text-brand hover:text-brand/85
                                        "
                                        onClick={onManage}
                                        aria-label="Add buyer"
                                    />
                                }
                            >
                                <Icon
                                    icon="tabler:user-plus"
                                    width={14}
                                    height={14}
                                    className="shrink-0 block-3.5 inline-3.5"
                                    aria-hidden
                                />
                                Add
                            </TooltipTrigger>
                            <TooltipContent side="top">Add buyer</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </span>
            ) : null}
        </div>
    );
}

/** Brokers with accepted consent for this property. */
export function AttachedBrokersRow({
    brokers,
    onManage,
}: {
    brokers: AttachedPerson[];
    onManage?: () => void;
}) {
    if (brokers.length === 0) return null;
    const title = (
        <>
            {brokers.length} {brokers.length === 1 ? "broker" : "brokers"}
            <span className="sr-only"> working on this property</span>
        </>
    );
    return <AttachedPeopleShell people={brokers} title={title} onManage={onManage} />;
}

/** Owner-sent invitations stay separate from brokers with accepted consent. */
export function InvitedBrokersRow({
    brokers,
    onManage,
}: {
    brokers: AttachedPerson[];
    onManage?: () => void;
}) {
    if (brokers.length === 0) return null;
    const content = (
        <>
            <AvatarStack people={brokers} size="2xs" max={3} className="shrink-0" />
            <span className="body-xs font-medium text-pending min-inline-0">
                {brokers.length}{" "}
                {brokers.length === 1 ? "invitation pending" : "invitations pending"}
            </span>
        </>
    );
    const rowClassName = "flex items-center gap-2 text-start inline-full min-inline-0";
    return onManage ? (
        <button
            type="button"
            onClick={onManage}
            className={cn(
                rowClassName,
                "rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring",
            )}
        >
            {content}
        </button>
    ) : (
        <div className={rowClassName}>{content}</div>
    );
}

/** Exclusive owner attached to a listing — tap opens the owner picker. */
export function AttachedOwnerRow({
    name,
    avatarUrl,
    onManage,
}: {
    name: string;
    avatarUrl?: string;
    onManage?: () => void;
}) {
    return (
        <AttachedPeopleShell
            people={[{ id: "owner", name, avatarUrl }]}
            title="Owner attached"
            onManage={onManage}
        />
    );
}
