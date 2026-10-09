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
export function AvatarStack({ people, max = 3, overflowLabel, className }: AvatarStackProps) {
    if (people.length === 0) return null;

    const visible = people.slice(0, max);
    const overflow = people.slice(max);

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
                                        index > 0 && "-ms-2.5",
                                    )}
                                >
                                    <UserAvatar
                                        name={person.name}
                                        imageUrl={person.avatarUrl}
                                        size="sm"
                                        className={STACK_FACE_CLASS}
                                    />
                                </span>
                            }
                        />
                        <TooltipContent side="top">{person.name}</TooltipContent>
                    </Tooltip>
                ))}

                {overflow.length > 0 ? (
                    <Tooltip>
                        <TooltipTrigger
                            render={
                                <span
                                    className={cn(
                                        `
                                          group/avatar body-xs relative -ms-2.5 inline-flex
                                          cursor-default items-center justify-center rounded-full
                                          bg-ink font-sans font-semibold text-surface shadow-xs
                                          ring-2 ring-surface transition-transform duration-160
                                          block-9 inline-9
                                          hover:z-10 hover:-translate-y-0.5
                                        `,
                                    )}
                                >
                                    +{overflow.length}
                                </span>
                            }
                        />
                        <TooltipContent side="top">
                            {overflowLabel ?? overflow.map((person) => person.name).join(", ")}
                        </TooltipContent>
                    </Tooltip>
                ) : null}
            </div>
        </TooltipProvider>
    );
}
