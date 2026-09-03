import { cn } from "@/lib/utils";

/** Vertical gap between filter trigger and dropdown panel. */
export const OWNER_LISTINGS_BAND_MENU_SIDE_OFFSET = 16;

/** Shared popup surface for owner-listings filter band — matches profile menu motion. */
export const OWNER_LISTINGS_BAND_MENU_CONTENT_CLASS = cn(
    "t-dropdown t-profile-menu animate-none! border border-border-warm bg-surface p-1.5",
    "text-ink shadow-lg ring-0",
    "before:backdrop-blur-none",
    "data-closed:animate-none!",
    "data-open:animate-none!",
    "**:data-[slot$=-item]:data-highlighted:bg-surface-muted!",
    "**:data-[slot$=-item]:data-highlighted:text-ink!",
    "**:data-[slot$=-item]:focus:bg-surface-muted!",
    "**:data-[slot$=-item]:focus:text-ink!",
    "**:data-[slot=dropdown-menu-checkbox-item]:data-highlighted:bg-surface-muted!",
    "**:data-[slot=dropdown-menu-checkbox-item]:data-highlighted:text-ink!",
    "**:data-[slot=dropdown-menu-checkbox-item]:focus:bg-surface-muted!",
    "**:data-[slot=dropdown-menu-checkbox-item]:focus:text-ink!",
    "**:data-[slot=dropdown-menu-radio-item]:data-highlighted:bg-surface-muted!",
    "**:data-[slot=dropdown-menu-radio-item]:data-highlighted:text-ink!",
    "**:data-[slot=dropdown-menu-radio-item]:focus:bg-surface-muted!",
    "**:data-[slot=dropdown-menu-radio-item]:focus:text-ink!",
);
