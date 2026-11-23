export type FinalCommissionType = "percent" | "amount";

export function resolveFinalCommission(
    type: FinalCommissionType,
    value: string | null,
    finalPrice: number,
) {
    // Smart inputs use null for invalid text; an empty string means omitted.
    if (value == null)
        return { amount: null, error: "Enter a valid commission, or leave it blank." };
    if (!value.trim()) return { amount: null, error: null };
    const number = Number(value);
    if (!/^\d+(?:\.\d{1,2})?$/.test(value) || !Number.isFinite(number) || number < 0) {
        return { amount: null, error: "Enter a valid commission, or leave it blank." };
    }
    if (type === "percent" && number > 100) {
        return { amount: null, error: "Commission must be between 0 and 100%." };
    }
    if (type === "amount" && (!Number.isSafeInteger(number) || number > 99_999_999_999)) {
        return { amount: null, error: "Enter the commission in whole rupees (up to 11 digits)." };
    }
    return {
        amount: type === "percent" ? Math.round((finalPrice * number) / 100) : number,
        error: null,
    };
}
