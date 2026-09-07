import { cn } from "@/lib/utils";

/** Vertical gap between filter trigger and dropdown panel. */
export const OWNER_LISTINGS_BAND_MENU_SIDE_OFFSET = 18;

/**
 * Slightly wider than the trigger so panel content breathes; pair with
 * `align="center"` so the extra width grows evenly left and right.
 */
export const OWNER_LISTINGS_BAND_MENU_WIDTH_CLASS = cn(
    "min-inline-0!",
    "inline-[calc(var(--anchor-width)+2rem)]!",
    "min-inline-[calc(var(--anchor-width)+2rem)]!",
    "max-inline-[min(calc(var(--anchor-width)+2rem),calc(100vw-1.5rem))]!",
);

/** Shared popup surface for owner-listings filter band — matches profile menu motion. */
export const OWNER_LISTINGS_BAND_MENU_CONTENT_CLASS = cn(
    "t-dropdown t-profile-menu animate-none! border border-border-warm bg-surface p-1.5",
    "text-ink shadow-lg ring-0",
    "before:backdrop-blur-none",
    "data-closed:animate-none!",
    "data-open:animate-none!",
    // Hover/highlight only on unchecked items — selected rows keep their active fill
    "**:data-[slot$=-item]:not([data-checked]):data-highlighted:bg-surface-muted!",
    "**:data-[slot$=-item]:not([data-checked]):data-highlighted:text-ink!",
    "**:data-[slot$=-item]:not([data-checked]):focus:bg-surface-muted!",
    "**:data-[slot$=-item]:not([data-checked]):focus:text-ink!",
    `
      **:data-[slot=dropdown-menu-checkbox-item]:not([data-checked]):data-highlighted:bg-surface-muted!
    `,
    "**:data-[slot=dropdown-menu-checkbox-item]:not([data-checked]):data-highlighted:text-ink!",
    "**:data-[slot=dropdown-menu-checkbox-item]:not([data-checked]):focus:bg-surface-muted!",
    "**:data-[slot=dropdown-menu-checkbox-item]:not([data-checked]):focus:text-ink!",
    "**:data-[slot=dropdown-menu-checkbox-item]:data-checked:data-highlighted:bg-brand-soft!",
    "**:data-[slot=dropdown-menu-checkbox-item]:data-checked:focus:bg-brand-soft!",
    "**:data-[slot=dropdown-menu-checkbox-item]:data-checked:hover:bg-brand-soft!",
    "**:data-[slot=dropdown-menu-radio-item]:not([data-checked]):data-highlighted:bg-surface-muted!",
    "**:data-[slot=dropdown-menu-radio-item]:not([data-checked]):data-highlighted:text-ink!",
    "**:data-[slot=dropdown-menu-radio-item]:not([data-checked]):focus:bg-surface-muted!",
    "**:data-[slot=dropdown-menu-radio-item]:not([data-checked]):focus:text-ink!",
);
