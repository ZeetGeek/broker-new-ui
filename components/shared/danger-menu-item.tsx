"use client";

import { PropertyMenuIcon } from "@/components/shared/icons";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

/**
 * Destructive dropdown row. A normal click — the caller opens a confirm modal
 * (`ConfirmDialog` or a domain dialog) before anything is removed.
 */
export function DangerMenuItem({
    onSelect,
    label,
    icon,
}: {
    onSelect: () => void;
    label: string;
    icon: "trash" | "lost";
}) {
    return (
        <DropdownMenuItem
            variant="destructive"
            className="
              cursor-pointer rounded-inner bg-danger-soft px-3 text-sm font-medium text-danger!
              min-block-10 focus:bg-danger-soft! focus:text-danger! data-highlighted:bg-danger-soft!
              data-highlighted:text-danger!
            "
            onClick={(event) => {
                event.stopPropagation();
                onSelect();
            }}
        >
            <PropertyMenuIcon
                name={icon}
                aria-hidden
                className="menu-stroke-icon is-danger shrink-0 block-4.5 inline-4.5"
            />
            {label}
        </DropdownMenuItem>
    );
}
