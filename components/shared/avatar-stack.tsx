"use client";

import type { ReactElement, ReactNode } from "react";

import { formatPersonName } from "@/lib/format/person-name";
import { cn } from "@/lib/utils";

import { InfoTip, InfoTipContent, InfoTipTrigger } from "@/components/shared/info-tip";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export type AvatarStackPerson = {
    id: string;
    name: string;
    avatarUrl?: string;
};

export type AvatarStackProps = {
    people: AvatarStackPerson[];
    /** Faces shown before the rest collapse into a `+N` chip. */
    max?: number;
    /** Tooltip text for the overflow chip. Defaults to listing the names. */
    overflowLabel?: string;
    /** Compact faces for inline metadata; existing people rows keep 36px faces. */
    size?: "sm" | "md" | "2xs" | "xxs";
    avatarClassName?: string;
    className?: string;
    /**
     * Set when the stack sits inside a clickable row (button / link). Names then
     * show on hover only, so a tap still runs the row's action. Otherwise a tap
     * on a face opens its name — the only way to read it on a phone.
     */
    hoverOnly?: boolean;
};

/** One face's name tip — tap-to-open by default, hover-only inside an action. */
function StackTip({
    hoverOnly,
    label,
    trigger,
    contentClassName,
    children,
}: {
    hoverOnly: boolean;
    label: string;
    trigger: ReactElement;
    contentClassName?: string;
    children: ReactNode;
}) {
    if (hoverOnly) {
        return (
            <Tooltip>
                <TooltipTrigger tabIndex={0} aria-label={label} render={trigger} />
                <TooltipContent side="top" className={contentClassName}>
                    {children}
                </TooltipContent>
            </Tooltip>
        );
    }
    return (
        <InfoTip>
            <InfoTipTrigger nativeButton={false} aria-label={label} render={trigger} />
            <InfoTipContent side="top" className={contentClassName}>
                {children}
            </InfoTipContent>
        </InfoTip>
    );
}

const STACK_FACE_CLASS = `
  shadow-xs ring-2 ring-surface transition-transform duration-160
  group-hover/avatar:-translate-y-0.5
`;

/**
 * Overlapping faces. Triggers opt into pointer events even inside a card panel
 * that lets clicks pass through. Hovered or focused faces rise above neighbours.
 */
export function AvatarStack({
    people,
    max = 3,
    overflowLabel,
    size = "sm",
    className,
    avatarClassName,
    hoverOnly = false,
}: AvatarStackProps) {
    if (people.length === 0) return null;

    const visible = people.slice(0, max);
    const overflow = people.slice(max);
    const compact = size === "2xs" || size === "xxs";

    return (
        <TooltipProvider>
            <span className={cn("isolate inline-flex items-center", className)}>
                {visible.map((person, index) => (
                    <StackTip
                        key={person.id}
                        hoverOnly={hoverOnly}
                        label={formatPersonName(person.name)}
                        contentClassName="capitalize"
                        trigger={
                            <span
                                className={cn(
                                    `
                                      group/avatar pointer-events-auto relative inline-flex
                                      cursor-default rounded-full
                                      hover:z-10
                                      focus-visible:z-10 focus-visible:outline-2
                                      focus-visible:outline-offset-2 focus-visible:outline-ring
                                      data-popup-open:z-10
                                    `,
                                    index > 0 && (compact ? "-ms-1.5" : "-ms-2.5"),
                                )}
                            >
                                <UserAvatar
                                    name={formatPersonName(person.name)}
                                    imageUrl={person.avatarUrl}
                                    size={size}
                                    className={cn(STACK_FACE_CLASS, avatarClassName)}
                                />
                            </span>
                        }
                    >
                        {formatPersonName(person.name)}
                    </StackTip>
                ))}

                {overflow.length > 0 ? (
                    <StackTip
                        hoverOnly={hoverOnly}
                        label={overflowLabel ?? overflow.map((person) => person.name).join(", ")}
                        contentClassName="flex-col items-stretch gap-3 p-3 pe-5 capitalize"
                        trigger={
                            <span
                                className={cn(
                                    `
                                      group/avatar body-xs pointer-events-auto relative
                                      inline-flex cursor-default items-center justify-center
                                      rounded-full bg-ink font-sans font-semibold text-surface
                                      shadow-xs ring-2 ring-surface transition-transform
                                      duration-160
                                      hover:z-10 hover:-translate-y-0.5
                                      focus-visible:z-10 focus-visible:outline-2
                                      focus-visible:outline-offset-2 focus-visible:outline-ring
                                      data-popup-open:z-10
                                    `,
                                    size === "xxs"
                                        ? "-ms-1.5 block-5 inline-5"
                                        : compact
                                          ? "-ms-1.5 block-6 inline-6"
                                          : size === "md"
                                            ? "-ms-2.5 block-10 inline-10"
                                            : "-ms-2.5 block-9 inline-9",
                                )}
                            >
                                +{overflow.length}
                            </span>
                        }
                    >
                        {overflowLabel ??
                            overflow.map((person) => (
                                <span key={person.id} className="flex items-center gap-2.5">
                                    <UserAvatar
                                        name={formatPersonName(person.name)}
                                        imageUrl={person.avatarUrl}
                                        size="2xs"
                                    />
                                    <span className="wrap-anywhere min-inline-0">
                                        {formatPersonName(person.name)}
                                    </span>
                                </span>
                            ))}
                    </StackTip>
                ) : null}
            </span>
        </TooltipProvider>
    );
}
