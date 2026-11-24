"use client";

import { PropertyMenuIcon as AccountMenuIcon } from "@/components/shared/icons";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

export type LogoutMenuItemProps = {
    disabled?: boolean;
    /** Opens the logout confirm. Never signs out directly. */
    onSelect: () => void;
};

export function LogoutMenuItem({ disabled = false, onSelect }: LogoutMenuItemProps) {
    return (
        <DropdownMenuItem
            variant="destructive"
            disabled={disabled}
            className="
              cursor-pointer gap-2.5 rounded-inner bg-danger-soft px-3 text-sm font-medium
              text-danger! block-11 inline-full focus:bg-danger-soft! focus:text-danger!
              data-highlighted:bg-danger-soft! data-highlighted:text-danger!
            "
            onClick={onSelect}
        >
            <AccountMenuIcon
                name="logout"
                aria-hidden
                className="menu-stroke-icon is-danger shrink-0 block-4.5 inline-4.5"
            />

            <span className="flex-1 min-inline-0">{disabled ? "Signing out…" : "Log out"}</span>
        </DropdownMenuItem>
    );
}
