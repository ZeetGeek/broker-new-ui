"use client";

import { cn } from "@/lib/utils";

import { AvatarStack } from "@/components/shared/avatar-stack";
import { OVERLAY_GLASS_BUTTON_CLASS } from "@/components/shared/overlay-card";

type AttachedPerson = { id: string; name: string; avatarUrl?: string };

function AttachedPeopleShell({
    people,
    title,
    onManage,
}: {
    people: AttachedPerson[];
    title: string;
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

/** Exclusive owner attached to a listing — tap opens the owner picker. */
export function AttachedOwnerRow({ name, onManage }: { name: string; onManage?: () => void }) {
    return (
        <AttachedPeopleShell
            people={[{ id: "owner", name }]}
            title="Owner attached"
            onManage={onManage}
        />
    );
}
