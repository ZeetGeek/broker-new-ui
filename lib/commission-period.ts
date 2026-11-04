export type CommissionPeriodMonths = 3 | 6 | 12;

/** Walk backwards in non-overlapping windows from the latest available month. */
export function getCommissionWindow<T>(
    history: readonly T[],
    months: CommissionPeriodMonths,
    page: number,
) {
    const lastPage = Math.max(0, Math.ceil(history.length / months) - 1);
    const pageIndex = Math.min(Math.max(0, Math.trunc(page)), lastPage);
    const end = history.length - pageIndex * months;
    return {
        data: history.slice(Math.max(0, end - months), end),
        pageIndex,
        hasPrevious: pageIndex < lastPage,
        hasNext: pageIndex > 0,
    };
}
