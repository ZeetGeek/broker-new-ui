import {
    MY_LISTINGS_GRID_CLASS,
    MY_LISTINGS_LIST_CLASS,
} from "@/features/properties/your-listings/my-listings-grid-class";

export const REQUESTS_GRID_CLASS = MY_LISTINGS_GRID_CLASS;

/** Compact horizontal cards — two across from md up. */
export const REQUESTS_LIST_CLASS = MY_LISTINGS_LIST_CLASS;

export const REQUESTS_GRID_BREAKPOINTS = [
    { minWidth: 640, columns: 2 },
    { minWidth: 768, columns: 3 },
    { minWidth: 1024, columns: 4 },
    { minWidth: 1280, columns: 5 },
];

export const REQUESTS_LIST_BREAKPOINTS = [{ minWidth: 768, columns: 2 }];
