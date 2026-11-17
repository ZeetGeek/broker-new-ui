import assert from "node:assert/strict";
import test from "node:test";

import {
    amountFormatFor,
    formatAmountGrouped,
    parseAmount,
    splitAmountRange,
} from "@/lib/format/amount-input";
import { type Currency, DEFAULT_CURRENCY } from "@/lib/format/currency";

const INR = DEFAULT_CURRENCY;
const USD: Currency = { code: "USD", symbol: "$" };
const EUR: Currency = { code: "EUR", symbol: "€" };
const AED: Currency = { code: "AED", symbol: "AED" };
const CHF: Currency = { code: "CHF", symbol: "CHF" };
const VND: Currency = { code: "VND", symbol: "₫" };

const IN = amountFormatFor(INR, "IN");
const US = amountFormatFor(USD, "US");
const DE = amountFormatFor(EUR, "DE");
const FR = amountFormatFor(EUR, "FR");
const AE = amountFormatFor(AED, "AE");
const CH = amountFormatFor(CHF, "CH");
const VN = amountFormatFor(VND, "VN");

function value(text: string, currency: Currency, format = US) {
    return parseAmount(text, currency, format).value;
}

test("shorthand K / M / B works in every market", () => {
    assert.equal(value("29k", USD), 29_000);
    assert.equal(value("21.5k", USD), 21_500);
    assert.equal(value("21.5K", USD), 21_500);
    assert.equal(value("21.5 k", USD), 21_500);
    assert.equal(value(".5M", USD), 500_000);
    assert.equal(value("1.k", USD), 1_000);
    assert.equal(value("1.25m", USD), 1_250_000);
    assert.equal(value("2 million", USD), 2_000_000);
    assert.equal(value("3bn", USD), 3_000_000_000);
    assert.equal(value("1.5mil", USD), 1_500_000);
    assert.equal(value("29k", EUR, DE), 29_000);
    assert.equal(value("1,5M", EUR, DE), 1_500_000);
});

test("lakh / crore only on Indian-numbering markets", () => {
    assert.equal(value("1.5L", INR, IN), 150_000);
    assert.equal(value("1.lacs", INR, IN), 100_000);
    assert.equal(value("25 lakh", INR, IN), 2_500_000);
    assert.equal(value("1.25cr", INR, IN), 12_500_000);
    assert.equal(value("1cr 20L", INR, IN), 12_000_000);
    assert.equal(value("2L 50k", INR, IN), 250_000);
    assert.equal(value("15,00,000", INR, IN), 1_500_000);
    assert.equal(parseAmount("1.5L", USD, US).status, "invalid");
    assert.equal(parseAmount("2cr", USD, US).status, "invalid");
    // M still means million in India.
    assert.equal(value("1.2M", INR, IN), 1_200_000);
});

test("compound amounts go biggest to smallest", () => {
    assert.equal(value("1m 200k", USD), 1_200_000);
    assert.equal(value("1m200k", USD), 1_200_000);
    assert.equal(value("2k 500", USD), 2_500);
    assert.equal(parseAmount("200k 1m", USD, US).status, "invalid");
    assert.equal(parseAmount("1k 1k", USD, US).status, "invalid");
});

test("separators follow the market's region", () => {
    assert.equal(value("1,250,000", USD), 1_250_000);
    assert.equal(value("1,250,000.60", USD), 1_250_001);
    assert.equal(value("1.250.000", EUR, DE), 1_250_000);
    assert.equal(value("1.250.000,40", EUR, DE), 1_250_000);
    assert.equal(value("1 250 000", EUR, FR), 1_250_000);
    assert.equal(value("1 250 000", EUR, FR), 1_250_000);
    assert.equal(value("1'250'000", CHF, CH), 1_250_000);
    assert.equal(value("1’250’000", CHF, CH), 1_250_000);
    // One ambiguous mark resolves with the region's decimal.
    assert.equal(value("1,500", USD), 1_500);
    assert.equal(value("1,500", EUR, DE), 2);
    assert.equal(value("1.500", EUR, DE), 1_500);
});

test("symbols, codes and noise are ignored", () => {
    assert.equal(value("$1,250,000", USD), 1_250_000);
    assert.equal(value("USD 500k", USD), 500_000);
    assert.equal(value("500k usd", USD), 500_000);
    assert.equal(value("1.250.000 €", EUR, DE), 1_250_000);
    assert.equal(value("EUR 1,5M", EUR, DE), 1_500_000);
    assert.equal(value("AED 2.5M", AED, AE), 2_500_000);
    assert.equal(value("₹25,00,000/-", INR, IN), 2_500_000);
    assert.equal(value("‏1,500", AED, AE), 1_500);
    assert.equal(value("２９ｋ", USD), 29_000);
});

test("maths is exact, no float drift", () => {
    assert.equal(value("1.15L", INR, IN), 115_000);
    assert.equal(value("0.29k", USD), 290);
    assert.equal(value("4.35m", USD), 4_350_000);
    assert.equal(value("1.0005k", USD), 1_001);
});

test("bad input is reported, never silently changed", () => {
    assert.equal(parseAmount("", USD, US).status, "empty");
    assert.equal(parseAmount("   ", USD, US).status, "empty");
    assert.equal(parseAmount("2..5k", USD, US).status, "invalid");
    assert.equal(parseAmount("abc", USD, US).status, "invalid");
    assert.equal(parseAmount("5x", USD, US).status, "invalid");
    assert.equal(parseAmount("1,5,0", USD, US).status, "invalid");
    assert.equal(parseAmount("-500", USD, US).status, "invalid");
    assert.equal(parseAmount("10k", USD, US, 5_000).status, "too-large");
    assert.equal(parseAmount("9999tn", USD, US).status, "too-large");
});

test("big-denomination currencies fit", () => {
    assert.equal(value("50 billion", VND, VN), 50_000_000_000);
    assert.equal(value("50.000.000.000", VND, VN), 50_000_000_000);
});

test("grouped display round-trips through the parser in every region", () => {
    const cases: [Currency, ReturnType<typeof amountFormatFor>][] = [
        [INR, IN],
        [USD, US],
        [EUR, DE],
        [EUR, FR],
        [AED, AE],
        [CHF, CH],
        [VND, VN],
    ];
    for (const [currency, format] of cases) {
        for (const amount of [1, 999, 1_500, 85_000, 1_250_000, 12_345_678, 50_000_000_000]) {
            const shown = formatAmountGrouped(amount, format);
            assert.equal(
                parseAmount(shown, currency, format).value,
                amount,
                `${format.locale}: ${shown}`,
            );
        }
    }
    assert.equal(formatAmountGrouped(1_500_000, IN), "15,00,000");
    assert.equal(formatAmountGrouped(1_500_000, US), "1,500,000");
    assert.equal(formatAmountGrouped(1_500_000, DE), "1.500.000");
});

test("terms add up with +", () => {
    assert.equal(value("10k+20k", USD), 30_000);
    assert.equal(value("10k + 20k", USD), 30_000);
    assert.equal(value("1.5M + 250k", USD), 1_750_000);
    assert.equal(value("1M 200k + 50k", USD), 1_250_000);
    assert.equal(value("$10k + $5,000", USD), 15_000);
    assert.equal(value("85L + 5L", INR, IN), 9_000_000);
    assert.equal(value("1cr+50L+25k", INR, IN), 15_025_000);
    assert.equal(value("1.250.000 + 50.000", EUR, DE), 1_300_000);
    assert.equal(value("10k＋20k", USD), 30_000);
    assert.equal(parseAmount("10k+", USD, US).status, "invalid");
    assert.equal(parseAmount("+10k", USD, US).status, "invalid");
    assert.equal(parseAmount("10k++5k", USD, US).status, "invalid");
    assert.equal(parseAmount("10k+abc", USD, US).status, "invalid");
    assert.equal(parseAmount("4k+4k", USD, US, 5_000).status, "too-large");
});

test("ranges split on dash or 'to'", () => {
    assert.deepEqual(splitAmountRange("500k-750k"), ["500k", "750k"]);
    assert.deepEqual(splitAmountRange("500k – 750k"), ["500k", "750k"]);
    assert.deepEqual(splitAmountRange("50L to 60L"), ["50L", "60L"]);
    assert.equal(splitAmountRange("500k"), null);
});

test("currency symbol side follows the region", () => {
    assert.equal(US.symbolPosition, "start");
    assert.equal(DE.symbolPosition, "end");
    assert.equal(IN.numbering, "indian");
    assert.equal(US.numbering, "international");
});
