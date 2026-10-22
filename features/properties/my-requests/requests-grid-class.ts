import { MY_LISTINGS_GRID_CLASS } from "@/features/properties/your-listings/my-listings-grid-class";

export const REQUESTS_GRID_CLASS = MY_LISTINGS_GRID_CLASS;

/** Same minimum details space in skeletons and cards; longer content remains free to grow. */
export const DEAL_CARD_PANEL_CLASS = "min-block-60";
export const DEAL_CARD_CLASS = "[&>div:last-child]:min-block-60";

export const REQUESTS_GRID_BREAKPOINTS = [
    { minWidth: 640, columns: 2 },
    { minWidth: 768, columns: 3 },
    { minWidth: 1024, columns: 4 },
    { minWidth: 1280, columns: 5 },
];
