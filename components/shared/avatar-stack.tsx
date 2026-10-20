"use client";

import { cn } from "@/lib/utils";

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
    size?: "sm" | "2xs";
    className?: string;
};

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
}: AvatarStackProps) {
    if (people.length === 0) return null;

    const visible = people.slice(0, max);
    const overflow = people.slice(max);
    const compact = size === "2xs";

    return (
        <TooltipProvider>
            <div className={cn("isolate flex items-center", className)}>
                {visible.map((person, index) => (
                    <Tooltip key={person.id}>
                        <TooltipTrigger
                            tabIndex={0}
                            aria-label={person.name}
                            render={
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
                                        name={person.name}
                                        imageUrl={person.avatarUrl}
                                        size={size}
                                        className={STACK_FACE_CLASS}
                                    />
                                </span>
                            }
                        />
                        <TooltipContent side="top" className="capitalize">
                            {person.name}
                        </TooltipContent>
                    </Tooltip>
                ))}

                {overflow.length > 0 ? (
                    <Tooltip>
                        <TooltipTrigger
                            tabIndex={0}
                            aria-label={
                                overflowLabel ?? overflow.map((person) => person.name).join(", ")
                            }
                            render={
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
                                        compact
                                            ? "-ms-1.5 block-6 inline-6"
                                            : "-ms-2.5 block-9 inline-9",
                                    )}
                                >
                                    +{overflow.length}
                                </span>
                            }
                        />
                        <TooltipContent
                            side="top"
                            className="flex-col items-stretch gap-3 p-3 pe-5 capitalize"
                        >
                            {overflowLabel ??
                                overflow.map((person) => (
                                    <span key={person.id} className="flex items-center gap-2.5">
                                        <UserAvatar
                                            name={person.name}
                                            imageUrl={person.avatarUrl}
                                            size="2xs"
                                        />
                                        <span className="wrap-anywhere min-inline-0">
                                            {person.name}
                                        </span>
                                    </span>
                                ))}
                        </TooltipContent>
                    </Tooltip>
                ) : null}
            </div>
        </TooltipProvider>
    );
}
