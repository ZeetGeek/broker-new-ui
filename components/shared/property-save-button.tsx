"use client";

import { Bookmark } from "lucide-react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type PropertySaveButtonProps = {
    isSaved: boolean;
    /** Listing title, used so screen readers know which property is being saved. */
    title: string;
    onToggle: () => void;
    /** Icon-only button for photo overlays. Style it through `className`. */
    iconOnly?: boolean;
    className?: string;
};

export function PropertySaveButton({
    isSaved,
    title,
    onToggle,
    iconOnly = false,
    className,
}: PropertySaveButtonProps) {
    return (
        <Tooltip>
            <TooltipTrigger
                render={
                    <Button
                        type="button"
                        variant={iconOnly ? "ghost" : "link"}
                        size={iconOnly ? "icon" : "sm"}
                        aria-pressed={isSaved}
                        aria-label={isSaved ? `Remove ${title} from saved` : `Save ${title}`}
                        onClick={onToggle}
                        className={cn(
                            !iconOnly && "gap-1.5 p-0 font-medium block-auto",
                            !iconOnly && isSaved && "text-brand-text",
                            className,
                        )}
                    />
                }
            >
                <Bookmark
                    aria-hidden
                    className={cn(
                        iconOnly ? "block-4 inline-4" : "block-3.5 inline-3.5",
                        isSaved && (iconOnly ? "fill-current" : "fill-brand text-brand"),
                    )}
                    strokeWidth={1.75}
                />
                {iconOnly ? null : isSaved ? "Saved" : "Save"}
            </TooltipTrigger>
            <TooltipContent side="bottom">
                {isSaved ? "Remove from your saved properties" : "Save to check again later"}
            </TooltipContent>
        </Tooltip>
    );
}
