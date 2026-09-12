export const TAX_CONFIG = {
    GST_RATE: 0.18,
    TDS_RATE: 0.02,
    TDS_RATE_NO_PAN: 0.2,
    TDS_THRESHOLD: 20_000,
} as const;

type TaxInput = {
    gross: number;
    gstApplicable: boolean;
    gstMode: "exclusive" | "inclusive";
    tdsApplicable: boolean;
    tdsRate: number;
};

export type CommissionTaxResult = {
    gross: number;
    base: number;
    gst: number;
    tds: number;
    invoiceTotal: number;
    brokerReceives: number;
    brokerRealIncome: number;
    tdsCredit: number;
};

export type SaleCommissionInput = {
    salePrice: number;
    areaSqft: number;
    mode: "percent" | "flat" | "per_sqft";
    value: number;
    paidBy: "owner" | "buyer" | "both";
    ownerSharePercent: number;
    separateRates?: { ownerPercent: number; buyerPercent: number };
    gstApplicable: boolean;
    gstMode: "exclusive" | "inclusive";
    tdsApplicable: boolean;
    tdsRate: number;
    otherOwnerDeductions?: number;
    buyerSideCharges?: number;
};

export type SaleCommissionResult = CommissionTaxResult & {
    ownerGross: number;
    buyerGross: number;
    ownerPays: number;
    buyerPays: number;
    ownerNet: number;
    buyerTotalCost: number;
    effectiveRatePerSqft: number;
    commissionAsPercent: number;
};

export type RentCommissionInput = {
    monthlyRent: number;
    securityDeposit: number;
    maintenanceAmount: number;
    maintenancePaidBy: "owner" | "tenant";
    lockInMonths: number;
    agreementMonths: number;
    escalationPercent: number;
    mode: "months" | "percent_annual" | "percent_monthly" | "flat" | "percent_lease_value";
    value: number;
    paidBy: "owner" | "tenant" | "both";
    ownerSharePercent: number;
    renewalFeeMonths?: number;
    gstApplicable: boolean;
    gstMode: "exclusive" | "inclusive";
    tdsApplicable: boolean;
    tdsRate: number;
};

export type RentCommissionResult = CommissionTaxResult & {
    annualRent: number;
    leaseValue: number;
    ownerGross: number;
    tenantGross: number;
    ownerPays: number;
    tenantPays: number;
    ownerFirstPayout: number;
    ownerYearOneNet: number;
    ownerLeaseNet: number;
    tenantMoveInCost: number;
    renewalFee: number;
    threeYearEarning: number;
};

function finite(value: number | null | undefined): number {
    return Number.isFinite(value) ? Math.max(0, value ?? 0) : 0;
}

function money(value: number): number {
    return Math.round(Number.isFinite(value) ? Math.max(0, value) : 0);
}

function percentage(value: number): number {
    return Math.round((Number.isFinite(value) ? Math.max(0, value) : 0) * 100) / 100;
}

export function calculateTax(input: TaxInput): CommissionTaxResult {
    const gross = finite(input.gross);
    const base =
        input.gstApplicable && input.gstMode === "inclusive"
            ? gross / (1 + TAX_CONFIG.GST_RATE)
            : gross;
    const gst = input.gstApplicable
        ? input.gstMode === "inclusive"
            ? gross - base
            : base * TAX_CONFIG.GST_RATE
        : 0;
    const tds =
        input.tdsApplicable && base > TAX_CONFIG.TDS_THRESHOLD
            ? (base * finite(input.tdsRate)) / 100
            : 0;
    const invoiceTotal = base + gst;
    return {
        gross: money(gross),
        base: money(base),
        gst: money(gst),
        tds: money(tds),
        invoiceTotal: money(invoiceTotal),
        brokerReceives: money(invoiceTotal - tds),
        brokerRealIncome: money(base),
        tdsCredit: money(tds),
    };
}

function sideInvoice(gross: number, totalGross: number, invoiceTotal: number): number {
    if (totalGross <= 0) return 0;
    return money(invoiceTotal * (gross / totalGross));
}

export function calculateSaleCommission(input: SaleCommissionInput): SaleCommissionResult {
    const salePrice = finite(input.salePrice);
    const areaSqft = finite(input.areaSqft);
    const value = finite(input.value);
    let gross =
        input.mode === "percent"
            ? (salePrice * value) / 100
            : input.mode === "per_sqft"
              ? areaSqft * value
              : value;
    let ownerGross = 0;
    let buyerGross = 0;

    if (input.separateRates) {
        ownerGross = (salePrice * finite(input.separateRates.ownerPercent)) / 100;
        buyerGross = (salePrice * finite(input.separateRates.buyerPercent)) / 100;
        gross = ownerGross + buyerGross;
    } else if (input.paidBy === "owner") {
        ownerGross = gross;
    } else if (input.paidBy === "buyer") {
        buyerGross = gross;
    } else {
        const ownerShare = Math.min(100, finite(input.ownerSharePercent));
        ownerGross = (gross * ownerShare) / 100;
        buyerGross = gross - ownerGross;
    }

    const tax = calculateTax({
        gross,
        gstApplicable: input.gstApplicable,
        gstMode: input.gstMode,
        tdsApplicable: input.tdsApplicable,
        tdsRate: input.tdsRate,
    });
    const ownerPays = sideInvoice(ownerGross, gross, tax.invoiceTotal);
    const buyerPays = sideInvoice(buyerGross, gross, tax.invoiceTotal);

    return {
        ...tax,
        ownerGross: money(ownerGross),
        buyerGross: money(buyerGross),
        ownerPays,
        buyerPays,
        ownerNet: money(salePrice - ownerPays - finite(input.otherOwnerDeductions)),
        buyerTotalCost: money(salePrice + buyerPays + finite(input.buyerSideCharges)),
        effectiveRatePerSqft: areaSqft > 0 ? money(salePrice / areaSqft) : 0,
        commissionAsPercent: salePrice > 0 ? percentage((gross / salePrice) * 100) : 0,
    };
}

export function calculateLeaseValue(
    monthlyRent: number,
    agreementMonths: number,
    escalationPercent: number,
): number {
    const months = Math.ceil(finite(agreementMonths));
    let remaining = months;
    let rent = finite(monthlyRent);
    let total = 0;
    while (remaining > 0) {
        const monthsThisYear = Math.min(12, remaining);
        total += rent * monthsThisYear;
        rent *= 1 + finite(escalationPercent) / 100;
        remaining -= monthsThisYear;
    }
    return money(total);
}

export function calculateRentCommission(input: RentCommissionInput): RentCommissionResult {
    const monthlyRent = finite(input.monthlyRent);
    const annualRent = monthlyRent * 12;
    const leaseValue = calculateLeaseValue(
        monthlyRent,
        input.agreementMonths,
        input.escalationPercent,
    );
    const value = finite(input.value);
    const gross =
        input.mode === "months"
            ? monthlyRent * value
            : input.mode === "percent_annual"
              ? (annualRent * value) / 100
              : input.mode === "percent_monthly"
                ? (monthlyRent * value) / 100
                : input.mode === "percent_lease_value"
                  ? (leaseValue * value) / 100
                  : value;

    let ownerGross = 0;
    let tenantGross = 0;
    if (input.paidBy === "owner") ownerGross = gross;
    else if (input.paidBy === "tenant") tenantGross = gross;
    else {
        const ownerShare = Math.min(100, finite(input.ownerSharePercent));
        ownerGross = (gross * ownerShare) / 100;
        tenantGross = gross - ownerGross;
    }

    const tax = calculateTax({
        gross,
        gstApplicable: input.gstApplicable,
        gstMode: input.gstMode,
        tdsApplicable: input.tdsApplicable,
        tdsRate: input.tdsRate,
    });
    const ownerPays = sideInvoice(ownerGross, gross, tax.invoiceTotal);
    const tenantPays = sideInvoice(tenantGross, gross, tax.invoiceTotal);
    const securityDeposit = finite(input.securityDeposit);
    const maintenance = finite(input.maintenanceAmount);
    const renewalFee = monthlyRent * finite(input.renewalFeeMonths);

    return {
        ...tax,
        annualRent: money(annualRent),
        leaseValue,
        ownerGross: money(ownerGross),
        tenantGross: money(tenantGross),
        ownerPays,
        tenantPays,
        ownerFirstPayout: money(securityDeposit + monthlyRent - ownerPays),
        ownerYearOneNet: money(
            annualRent - ownerPays - (input.maintenancePaidBy === "owner" ? maintenance * 12 : 0),
        ),
        ownerLeaseNet: money(leaseValue - ownerPays),
        tenantMoveInCost: money(
            securityDeposit +
                monthlyRent +
                tenantPays +
                (input.maintenancePaidBy === "tenant" ? maintenance : 0),
        ),
        renewalFee: money(renewalFee),
        threeYearEarning: money(tax.brokerRealIncome + renewalFee * 2),
    };
}
