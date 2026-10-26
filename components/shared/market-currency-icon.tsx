"use client";

import { createElement } from "react";

import { useMarketCurrency } from "@/hooks/use-market";

import { currencyIcon, type IconProps } from "@/components/shared/icons";

/** The glyph for the signed-in user's currency (₹, $, €, …) as an inline icon. */
export function MarketCurrencyIcon(props: IconProps) {
    const { code } = useMarketCurrency();
    return createElement(currencyIcon(code), props);
}
