"use client";

import { useState } from "react";

import { amountFormatFor, formatAmountWithSymbol, parseAmount } from "@/lib/format/amount-input";
import type { Currency } from "@/lib/format/currency";

import { filterChipClassName } from "@/components/shared/filter-chip";
import { type PriceRange, PriceRangeInput } from "@/components/shared/price-range-input";
import { type PriceInputStatus, SmartPriceInput } from "@/components/shared/smart-price-input";

import { DesignSystemShell } from "@/features/design-system/design-system-shell";

type DemoMarket = {
    label: string;
    iso2: string;
    currency: Currency;
    /** A typical sale price in this market, for the reference demos. */
    typicalSale: number;
    areaUnit: "sqft" | "sqm";
    examples: string[];
};

const MARKETS: DemoMarket[] = [
    {
        label: "India · INR",
        iso2: "IN",
        currency: { code: "INR", symbol: "₹" },
        typicalSale: 8_500_000,
        areaUnit: "sqft",
        examples: [
            "29k",
            "21.5k",
            "1.5L",
            "1.lacs",
            "25 lakh",
            "1.25cr",
            "1cr 20L",
            "15,00,000",
            "₹25,00,000/-",
            "1.2M",
            "85L + 5L",
            "1cr+50L+25k",
        ],
    },
    {
        label: "United States · USD",
        iso2: "US",
        currency: { code: "USD", symbol: "$" },
        typicalSale: 450_000,
        areaUnit: "sqft",
        examples: [
            "29k",
            "21.5k",
            "450K",
            "1.25m",
            "1m 200k",
            "$1,250,000",
            "USD 500k",
            "2 million",
            "1.5L",
            "2..5k",
            "10k+20k",
            "1.5M + 250k",
            "10k+",
        ],
    },
    {
        label: "United Kingdom · GBP",
        iso2: "GB",
        currency: { code: "GBP", symbol: "£" },
        typicalSale: 350_000,
        areaUnit: "sqft",
        examples: ["350k", "£1.2m", "1,250,000", "GBP 2.5M", "1m 50k"],
    },
    {
        label: "Germany · EUR",
        iso2: "DE",
        currency: { code: "EUR", symbol: "€" },
        typicalSale: 400_000,
        areaUnit: "sqm",
        examples: [
            "400k",
            "1,5M",
            "1.250.000",
            "1.250.000,40 €",
            "EUR 2,5 Mio",
            "1.500",
            "1,500",
            "1.250.000 + 50.000",
        ],
    },
    {
        label: "France · EUR",
        iso2: "FR",
        currency: { code: "EUR", symbol: "€" },
        typicalSale: 400_000,
        areaUnit: "sqm",
        examples: ["400k", "1 250 000", "1 250 000,50 €", "2,5M"],
    },
    {
        label: "Switzerland · CHF",
        iso2: "CH",
        currency: { code: "CHF", symbol: "CHF" },
        typicalSale: 1_200_000,
        areaUnit: "sqm",
        examples: ["1.2M", "1'250'000", "1’250’000", "CHF 950k"],
    },
    {
        label: "UAE · AED",
        iso2: "AE",
        currency: { code: "AED", symbol: "AED" },
        typicalSale: 2_000_000,
        areaUnit: "sqft",
        examples: ["2M", "AED 2.5M", "1,750,000", "850k"],
    },
    {
        label: "Japan · JPY",
        iso2: "JP",
        currency: { code: "JPY", symbol: "¥" },
        typicalSale: 60_000_000,
        areaUnit: "sqm",
        examples: ["60M", "¥45,000,000", "1.2B", "120k"],
    },
    {
        label: "Vietnam · VND",
        iso2: "VN",
        currency: { code: "VND", symbol: "₫" },
        typicalSale: 5_000_000_000,
        areaUnit: "sqm",
        examples: ["5B", "50 billion", "5.000.000.000", "15M"],
    },
    {
        label: "Brazil · BRL",
        iso2: "BR",
        currency: { code: "BRL", symbol: "R$" },
        typicalSale: 900_000,
        areaUnit: "sqm",
        examples: ["900k", "R$ 1.250.000", "1,2M", "850.000,00"],
    },
];

const STATUS_LABEL: Record<PriceInputStatus, string> = {
    empty: "empty",
    valid: "valid",
    invalid: "can't read",
    "too-large": "too large",
    "too-small": "too small",
};

function Panel({
    title,
    note,
    children,
}: {
    title: string;
    note?: string;
    children: React.ReactNode;
}) {
    return (
        <section className="flex flex-col gap-4 rounded-card bg-surface p-5 shadow-sm">
            <div>
                <h2 className="h4 text-ink">{title}</h2>
                {note ? (
                    <p className="body-sm mbs-1 text-ink-muted max-inline-[65ch]">{note}</p>
                ) : null}
            </div>
            {children}
        </section>
    );
}

function ApiPayload({
    amount,
    currency,
    status,
}: {
    amount: number | null;
    currency: Currency;
    status: PriceInputStatus;
}) {
    return (
        <pre className="body-xs overflow-x-auto rounded-card bg-surface-muted p-3 text-ink">
            {JSON.stringify({ amount, currency: currency.code }, null, 2)}
            {`\n// field status: ${STATUS_LABEL[status]}`}
        </pre>
    );
}

export function PriceInputThemePage() {
    const [marketIndex, setMarketIndex] = useState(0);
    const market = MARKETS[marketIndex];
    const format = amountFormatFor(market.currency, market.iso2);

    const [kind, setKind] = useState<"sale" | "rent">("sale");
    const [amount, setAmount] = useState<number | null>(null);
    const [status, setStatus] = useState<PriceInputStatus>("empty");

    const [offer, setOffer] = useState<number | null>(null);
    const [rent, setRent] = useState<number | null>(null);
    const [bounded, setBounded] = useState<number | null>(null);
    const [range, setRange] = useState<PriceRange>({ min: null, max: null });

    const typicalRent = Math.round(market.typicalSale * 0.004);
    const areaSize = market.areaUnit === "sqft" ? 1_200 : 110;

    return (
        <DesignSystemShell
            eyebrow="Components"
            title="Smart price input."
            description="Type amounts the way people say them: 29k, 21.5k, 1.5M, 1M 200k, or 1.5L / 1cr 20L in markets that use lakh and crore. Separators, symbol side and shorthand follow the market. The parent only ever gets a whole-unit integer, or null."
        >
            <div className="flex flex-col gap-6">
                <Panel
                    title="Market"
                    note="Signed-in users get their own market automatically. Pick one here to test."
                >
                    <div className="flex flex-wrap gap-2">
                        {MARKETS.map((m, index) => (
                            <button
                                key={m.label}
                                type="button"
                                className={filterChipClassName(index === marketIndex)}
                                onClick={() => {
                                    setMarketIndex(index);
                                    setAmount(null);
                                    setStatus("empty");
                                    setOffer(null);
                                    setRent(null);
                                    setBounded(null);
                                    setRange({ min: null, max: null });
                                }}
                            >
                                {m.label}
                            </button>
                        ))}
                    </div>
                    <p className="body-xs text-ink-subtle">
                        Locale <code>{format.locale}</code> · decimal mark “{format.decimal}” ·{" "}
                        {format.numbering} numbering · symbol at the {format.symbolPosition}
                    </p>
                </Panel>

                <Panel
                    title="Playground"
                    note="Type shorthand like 29k, 1.5M or 1.5L, or add amounts like 10k+20k. Leave the field to see errors."
                >
                    <div className="flex gap-2">
                        {(["sale", "rent"] as const).map((k) => (
                            <button
                                key={k}
                                type="button"
                                className={filterChipClassName(kind === k)}
                                onClick={() => setKind(k)}
                            >
                                {k === "sale" ? "Sale price" : "Monthly rent"}
                            </button>
                        ))}
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,18rem)]">
                        <div className="flex flex-col gap-1.5">
                            <label
                                htmlFor="price-playground"
                                className="body-sm font-semibold text-ink"
                            >
                                {kind === "sale" ? "Price" : "Rent per month"}
                            </label>
                            <SmartPriceInput
                                key={`play-${market.label}`}
                                id="price-playground"
                                value={amount}
                                onValueChange={(next, nextStatus) => {
                                    setAmount(next);
                                    setStatus(nextStatus);
                                }}
                                kind={kind}
                                currency={market.currency}
                                iso2={market.iso2}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <p className="body-sm font-semibold text-ink">Sent to the API</p>
                            <ApiPayload
                                amount={amount}
                                currency={market.currency}
                                status={status}
                            />
                        </div>
                    </div>
                </Panel>

                <Panel
                    title="How inputs read in this market"
                    note="Live output of the same parser the field uses."
                >
                    <div className="overflow-x-auto">
                        <table className="body-sm inline-full">
                            <thead>
                                <tr className="text-start text-ink-muted">
                                    <th className="py-2 pe-4 text-start font-semibold">Typed</th>
                                    <th className="py-2 pe-4 text-start font-semibold">Result</th>
                                </tr>
                            </thead>
                            <tbody>
                                {market.examples.map((example) => {
                                    const parsed = parseAmount(example, market.currency, format);
                                    return (
                                        <tr key={example} className="border-bs border-border-warm">
                                            <td className="py-2 pe-4">
                                                <code>{example}</code>
                                            </td>
                                            <td className="tabular py-2 pe-4">
                                                {parsed.status === "valid" ? (
                                                    <span className="text-ink">
                                                        {formatAmountWithSymbol(
                                                            parsed.value,
                                                            market.currency,
                                                            format,
                                                        )}
                                                    </span>
                                                ) : (
                                                    <span className="text-danger">
                                                        {STATUS_LABEL[parsed.status]}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </Panel>

                <Panel
                    title="Smart checks"
                    note="Compared with a listed price, price per area, and a warning for an extra or missing zero. Try typing 10× the listed price."
                >
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="price-offer" className="body-sm font-semibold text-ink">
                                Final price
                            </label>
                            <SmartPriceInput
                                key={`offer-${market.label}`}
                                id="price-offer"
                                value={offer}
                                onValueChange={setOffer}
                                currency={market.currency}
                                iso2={market.iso2}
                                reference={{ amount: market.typicalSale, label: "listed price" }}
                                perArea={{ size: areaSize, unit: market.areaUnit }}
                            />
                            <p className="body-xs text-ink-subtle">
                                Listed{" "}
                                {formatAmountWithSymbol(
                                    market.typicalSale,
                                    market.currency,
                                    format,
                                )}{" "}
                                · {areaSize} {market.areaUnit === "sqft" ? "sq ft" : "m²"}
                            </p>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="price-rent" className="body-sm font-semibold text-ink">
                                Monthly rent (sale price is{" "}
                                {formatAmountWithSymbol(
                                    market.typicalSale,
                                    market.currency,
                                    format,
                                )}
                                )
                            </label>
                            <SmartPriceInput
                                key={`rent-${market.label}`}
                                id="price-rent"
                                kind="rent"
                                value={rent}
                                onValueChange={setRent}
                                currency={market.currency}
                                iso2={market.iso2}
                                pairedAmount={market.typicalSale}
                                reference={{ amount: typicalRent, label: "usual rent here" }}
                            />
                            <p className="body-xs text-ink-subtle">
                                Type the sale price here by mistake to see the warning.
                            </p>
                        </div>
                    </div>
                </Panel>

                <Panel
                    title="Min / max"
                    note="Errors show after you leave the field, never while you first type. Too large shows at once."
                >
                    <div className="flex flex-col gap-1.5 max-inline-md">
                        <label htmlFor="price-bounded" className="body-sm font-semibold text-ink">
                            Booking amount (between{" "}
                            {formatAmountWithSymbol(1_000, market.currency, format)} and{" "}
                            {formatAmountWithSymbol(market.typicalSale, market.currency, format)})
                        </label>
                        <SmartPriceInput
                            key={`bounded-${market.label}`}
                            id="price-bounded"
                            value={bounded}
                            onValueChange={setBounded}
                            currency={market.currency}
                            iso2={market.iso2}
                            min={1_000}
                            max={market.typicalSale}
                        />
                    </div>
                </Panel>

                <Panel
                    title="Range"
                    note="Type or paste a whole range into either box. Both fill, smallest first."
                >
                    <PriceRangeInput
                        key={`range-${market.label}`}
                        value={range}
                        onValueChange={setRange}
                        currency={market.currency}
                        iso2={market.iso2}
                    />
                    <pre className="body-xs rounded-card bg-surface-muted p-3 text-ink">
                        {JSON.stringify(
                            {
                                budgetMin: range.min,
                                budgetMax: range.max,
                                currency: market.currency.code,
                            },
                            null,
                            2,
                        )}
                    </pre>
                </Panel>
            </div>
        </DesignSystemShell>
    );
}
