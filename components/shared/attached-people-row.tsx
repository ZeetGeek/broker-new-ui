"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { AttachedClientsSummary } from "@/components/shared/attached-clients-summary";
import { AvatarStack } from "@/components/shared/avatar-stack";
import { UserPlus } from "@/components/shared/icons";
import {
    OVERLAY_GLASS_BUTTON_CLASS,
    OVERLAY_PERSON_LABEL_CLASS,
    OverlayPersonAttachLine,
} from "@/components/shared/overlay-card";
import { UserAvatar } from "@/components/shared/user-avatar";

type AttachedPerson = { id: string; name: string; avatarUrl?: string };

type PartyMeetSide = {
    name: string;
    avatarUrl?: string;
    /** Screen-reader role, e.g. "Owner" / "Buyer" / "Broker". */
    role: string;
    onOpen?: () => void;
    people?: AttachedPerson[];
};

/**
 * Owner/broker + buyer in one glass strip — two equal halves split by a
 * center divider. Name on top, role under it. Used on pipeline and owner-lead
 * cards so both portals read a deal the same way.
 */
export function PartyMeetRow({
    left,
    right,
    highlightOnHover = true,
}: {
    left: PartyMeetSide;
    right: PartyMeetSide;
    highlightOnHover?: boolean;
}) {
    const ariaLabel = `${left.role} ${left.people?.map((person) => person.name).join(", ") || left.name}, ${right.role} ${right.people?.map((person) => person.name).join(", ") || right.name}`;

    return (
        <div
            role="group"
            aria-label={ariaLabel}
            className="
              flex items-stretch gap-2 overflow-hidden rounded-control border
              border-ink/15 bg-surface p-1.5 font-semibold text-ink inline-full
            "
        >
            <PartyMeetPerson side={left} highlightOnHover={highlightOnHover} />
            <div
                aria-hidden
                className="mbs-2.5 mbe-2.5 shrink-0 self-stretch bg-border-warm inline-px"
            />
            <PartyMeetPerson side={right} highlightOnHover={highlightOnHover} />
        </div>
    );
}

function PartyMeetPerson({
    side,
    highlightOnHover,
}: {
    side: PartyMeetSide;
    highlightOnHover: boolean;
}) {
    const content = (
        <>
            {side.people?.length ? (
                <span className="flex flex-col gap-0.5 min-inline-0">
                    <AttachedClientsSummary clients={side.people} />
                    {side.people.length === 1 ? (
                        <span className="body-xs text-ink-muted">{side.role}</span>
                    ) : null}
                </span>
            ) : (
                <>
                    <UserAvatar
                        name={side.name}
                        imageUrl={side.avatarUrl}
                        size="xs"
                        className="shrink-0"
                    />
                    <span className="flex flex-col gap-0.5 text-start min-inline-0">
                        <span className="body-sm truncate font-semibold tracking-wide text-ink capitalize">
                            {side.name}
                        </span>
                        <span className="body-xs truncate text-ink-muted">{side.role}</span>
                    </span>
                </>
            )}
        </>
    );

    const className = "flex flex-1 items-center gap-2.5 rounded-[8px] px-2 py-1.5 min-inline-0";

    if (side.onOpen) {
        return (
            <button
                type="button"
                onClick={side.onOpen}
                className={cn(
                    className,
                    highlightOnHover && "transition-colors duration-160 hover:bg-surface-muted/60",
                    `
                      focus-visible:outline-2 focus-visible:-outline-offset-2
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
            <span className="flex flex-col gap-0.5 min-inline-0">
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
                      flex items-center gap-2.5 rounded-control px-3 py-2.5 text-start
                      transition-colors duration-160 inline-full
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
                "flex items-center gap-2.5 rounded-control px-3 py-2.5",
                OVERLAY_GLASS_BUTTON_CLASS,
            )}
        >
            {content}
        </div>
    );
}

/**
 * Buyers row — empty + `onAttach`: brand "Attach buyers" link (UserPlus).
 * One client shows their avatar and name; multiple clients show two avatars and a count.
 */
export function AttachedBuyersRow({
    buyers,
    onAttach,
    isAttachBlocked = false,
    emptyLabel,
}: {
    buyers: AttachedPerson[];
    /** Opens the buyer picker when the row is empty. */
    onAttach?: () => void;
    isAttachBlocked?: boolean;
    emptyLabel?: string;
}) {
    if (buyers.length === 0) {
        if (!onAttach)
            return emptyLabel ? (
                <div className="body-sm flex items-center gap-2 tracking-wide text-ink-muted min-inline-0">
                    <span className={OVERLAY_PERSON_LABEL_CLASS}>Clients</span>
                    <span>{emptyLabel}</span>
                </div>
            ) : null;
        return (
            <OverlayPersonAttachLine
                label="Clients"
                actionLabel="Attach clients"
                onAttach={onAttach}
                isBlocked={isAttachBlocked}
                icon={UserPlus}
            />
        );
    }

    return (
        <div
            className="
              body-sm flex items-center gap-2 tracking-wide text-ink-muted inline-full min-inline-0
            "
        >
            <span className={OVERLAY_PERSON_LABEL_CLASS}>Clients</span>
            <AttachedClientsSummary clients={buyers} className="flex-1" />
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
                `
                  rounded-sm
                  focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring
                `,
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
