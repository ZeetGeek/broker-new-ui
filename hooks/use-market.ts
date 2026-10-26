"use client";

import type { UserMarket } from "@/lib/auth/session";
import { type Currency, DEFAULT_CURRENCY } from "@/lib/format/currency";

import { useAppSelector } from "@/store/hooks";

/** The signed-in user's country, or null before one is chosen. */
export function useMarket(): UserMarket | null {
    return useAppSelector((state) => state.auth.user?.country ?? null);
}

/**
 * The currency the signed-in user works in. Use it where a symbol is shown on
 * its own (an input prefix, a filter label); formatted amounts already default
 * to it.
 */
export function useMarketCurrency(): Currency {
    return useMarket()?.currency ?? DEFAULT_CURRENCY;
}
