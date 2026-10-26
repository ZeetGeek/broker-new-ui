import assert from "node:assert/strict";
import test from "node:test";

import { type Currency, DEFAULT_CURRENCY, setActiveCurrency } from "@/lib/format/currency";
import { formatMoney, parseMoney } from "@/lib/format/money";
import { formatPrice, formatRent } from "@/lib/format/price";

import { getBudgetSteps } from "@/features/properties/owner-listings/owner-listings-budget-presets";

const USD: Currency = { code: "USD", symbol: "$" };
const AED: Currency = { code: "AED", symbol: "AED" };

test("INR keeps lakh / crore", () => {
    assert.equal(formatPrice(8_500_000, DEFAULT_CURRENCY), "₹85 L");
    assert.equal(formatPrice(15_000_000, DEFAULT_CURRENCY), "₹1.5 Cr");
    assert.equal(formatPrice(85_000, DEFAULT_CURRENCY), "₹85,000");
    assert.equal(formatRent(25_000, DEFAULT_CURRENCY), "₹25,000/mo");
});

test("other currencies read in K / M with their own symbol", () => {
    assert.equal(formatPrice(850_000, USD), "$850K");
    assert.equal(formatPrice(1_250_000, USD), "$1.25M");
    assert.equal(formatPrice(85_000, USD), "$85,000");
    assert.equal(formatRent(2_500, USD), "$2,500/mo");
});

test("a letter symbol is spaced from the digits", () => {
    assert.equal(formatPrice(2_000_000, AED), "AED 2M");
    assert.equal(formatMoney(1_500, AED), "AED 1,500");
});

test("formatters default to the active market currency", () => {
    setActiveCurrency(USD);
    try {
        assert.equal(formatPrice(500_000), "$500K");
    } finally {
        setActiveCurrency(null);
    }
    assert.equal(formatPrice(500_000), "₹5 L");
});

test("typed amounts parse in any currency", () => {
    assert.equal(parseMoney("$850k"), 850_000);
    assert.equal(parseMoney("USD 1.2m"), 1_200_000);
    assert.equal(parseMoney("₹85,00,000"), 8_500_000);
    assert.equal(parseMoney("1.5 cr"), 15_000_000);
});

test("budget presets follow the currency", () => {
    const inr = getBudgetSteps("sale", DEFAULT_CURRENCY);
    assert.equal(inr[1]?.label, "Under ₹25 L");

    const usd = getBudgetSteps("sale", USD);
    assert.equal(usd[1]?.label, "Under $100K");
    assert.ok(usd.every((step) => !step.label.includes("₹")));

    const usdRent = getBudgetSteps("rent", USD);
    assert.equal(usdRent[1]?.label, "Under $1K/mo");
});
