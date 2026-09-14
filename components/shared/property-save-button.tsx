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
    className?: string;
};

export function PropertySaveButton({ isSaved, title, onToggle, className }: PropertySaveButtonProps) {
    return (
        <Tooltip>
            <TooltipTrigger
                render={
                    <Button
                        type="button"
                        variant="link"
                        size="sm"
                        aria-pressed={isSaved}
                        aria-label={isSaved ? `Remove ${title} from saved` : `Save ${title}`}
                        onClick={onToggle}
                        className={cn(
                            "gap-1.5 p-0 font-medium block-auto",
                            isSaved && "text-brand-text",
                            className,
                        )}
                    />
                }
            >
                <Bookmark
                    aria-hidden
                    className={cn("block-3.5 inline-3.5", isSaved && "fill-brand text-brand")}
                    strokeWidth={1.75}
                />
                {isSaved ? "Saved" : "Save"}
            </TooltipTrigger>
            <TooltipContent side="bottom">
                {isSaved ? "Remove from your saved properties" : "Save to check again later"}
            </TooltipContent>
        </Tooltip>
    );
}
