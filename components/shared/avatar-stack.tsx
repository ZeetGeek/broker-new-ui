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
 * Overlapping faces with the leading one on top. Hovering lifts a face above
 * its neighbours — `z-index` alone cannot do this because later siblings paint
 * over earlier ones, so the hovered item raises its own stacking order.
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
            <div className={cn("flex items-center", className)}>
                {visible.map((person, index) => (
                    <Tooltip key={person.id}>
                        <TooltipTrigger
                            render={
                                <span
                                    className={cn(
                                        `
                                          group/avatar relative inline-flex cursor-default
                                          hover:z-10
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
                            render={
                                <span
                                    className={cn(
                                        `
                                          group/avatar body-xs relative inline-flex
                                          cursor-default items-center justify-center rounded-full
                                          bg-ink font-sans font-semibold text-surface shadow-xs
                                          ring-2 ring-surface transition-transform duration-160
                                          hover:z-10 hover:-translate-y-0.5
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
                        <TooltipContent side="top" className="capitalize">
                            {overflowLabel ?? overflow.map((person) => person.name).join(", ")}
                        </TooltipContent>
                    </Tooltip>
                ) : null}
            </div>
        </TooltipProvider>
    );
}
