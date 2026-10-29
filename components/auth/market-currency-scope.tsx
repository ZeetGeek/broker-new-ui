"use client";

import { Fragment, type ReactNode, useEffect } from "react";

import { type Currency, DEFAULT_CURRENCY, setActiveCurrency } from "@/lib/format/currency";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { refreshProfile } from "@/store/slices/auth-slice";

/**
 * Makes `currency` the one every formatter below uses.
 *
 * Set during render, before the children render, so the very first paint
 * already shows the right symbol. Keyed by the currency code: when it changes
 * the subtree remounts, and nothing keeps an amount formatted in the old one.
 */
export function CurrencyScope({
    currency,
    children,
}: {
    currency: Currency | null | undefined;
    children: ReactNode;
}) {
    const active = currency?.code ? currency : DEFAULT_CURRENCY;
    setActiveCurrency(active);
    return <Fragment key={active.code}>{children}</Fragment>;
}

/** The signed-in user's market currency, for everything inside the portal. */
export function MarketCurrencyScope({ children }: { children: ReactNode }) {
    const dispatch = useAppDispatch();
    const user = useAppSelector((state) => state.auth.user);

    // A session saved before country scoping has no `country` key at all.
    // Read the profile once so it picks up the market and its currency.
    const isStaleSession = user != null && user.country === undefined;
    useEffect(() => {
        if (isStaleSession) void dispatch(refreshProfile());
    }, [isStaleSession, dispatch]);

    return <CurrencyScope currency={user?.country?.currency}>{children}</CurrencyScope>;
}
