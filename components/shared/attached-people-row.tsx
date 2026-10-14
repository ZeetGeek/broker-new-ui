"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { AvatarStack } from "@/components/shared/avatar-stack";
import { OVERLAY_GLASS_BUTTON_CLASS } from "@/components/shared/overlay-card";
import { UserAvatar } from "@/components/shared/user-avatar";

type AttachedPerson = { id: string; name: string; avatarUrl?: string };

type PartyMeetSide = {
    name: string;
    avatarUrl?: string;
    /** Screen-reader role, e.g. "Owner" / "Buyer" / "Broker". */
    role: string;
    onOpen?: () => void;
};

/**
 * Owner/broker + buyer on one glass strip — used on pipeline and owner-lead
 * cards so the two people on a deal read in one line instead of two full-width
 * rows with empty space on the right.
 *
 * Left anchors start, right anchors end, connector sits in the middle so the
 * strip reads balanced even when one name is much shorter.
 */
export function PartyMeetRow({
    left,
    right,
    connector = "with",
}: {
    left: PartyMeetSide;
    right: PartyMeetSide;
    /** Plain link word between the two people. */
    connector?: string;
}) {
    const ariaLabel = `${left.role} ${left.name} ${connector} ${right.role} ${right.name}`;

    return (
        <div
            role="group"
            aria-label={ariaLabel}
            className={cn(
                "flex items-center gap-2 px-2.5 py-2 rounded-control inline-full",
                OVERLAY_GLASS_BUTTON_CLASS,
            )}
        >
            <PartyMeetPerson side={left} align="start" />
            <span
                aria-hidden
                className="body-xs shrink-0 font-medium tracking-wide text-ink-subtle"
            >
                {connector}
            </span>
            <PartyMeetPerson side={right} align="end" />
        </div>
    );
}

function PartyMeetPerson({ side, align }: { side: PartyMeetSide; align: "start" | "end" }) {
    const content = (
        <>
            <UserAvatar
                name={side.name}
                imageUrl={side.avatarUrl}
                size="2xs"
                fallback="character"
                className="shrink-0"
            />
            <span className="body-sm truncate font-semibold tracking-wide text-ink capitalize">
                {side.name}
            </span>
        </>
    );

    const className = cn(
        "flex min-inline-0 flex-1 items-center gap-2",
        align === "start" ? "justify-start text-start" : "justify-end text-end",
    );

    if (side.onOpen) {
        return (
            <button
                type="button"
                onClick={side.onOpen}
                title={`${side.role}: ${side.name}`}
                className={cn(
                    className,
                    `
                      rounded-sm transition-colors duration-160
                      hover:text-brand
                      focus-visible:outline-2 focus-visible:outline-offset-2
                      focus-visible:outline-ring
                    `,
                )}
            >
                {content}
            </button>
        );
    }

    return (
        <div className={className} title={`${side.role}: ${side.name}`}>
            {content}
        </div>
    );
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

/** Attached buyers — tap opens the manage-buyers modal (add more / review). */
export function AttachedBuyersRow({
    buyers,
    onManage,
}: {
    buyers: AttachedPerson[];
    onManage?: () => void;
}) {
    if (buyers.length === 0) return null;

    const title = buyers.length === 1 ? "1 buyer" : `${buyers.length} buyers`;
    return <AttachedPeopleShell people={buyers} title={title} onManage={onManage} />;
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
