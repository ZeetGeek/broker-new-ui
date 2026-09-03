/**
 * Build the visible page tokens for a compact pager (1 … 4 5 6 … 20).
 * Pure helper — no React.
 */
export type PaginationPageToken = number | "ellipsis";

export function getVisiblePages(
    currentPage: number,
    totalPages: number,
    siblingCount = 1,
): PaginationPageToken[] {
    if (totalPages <= 0) return [];

    const current = Math.min(Math.max(1, currentPage), totalPages);

    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const pages = new Set<number>([1, totalPages]);
    for (let page = current - siblingCount; page <= current + siblingCount; page++) {
        if (page >= 1 && page <= totalPages) {
            pages.add(page);
        }
    }

    const sorted = [...pages].sort((a, b) => a - b);
    const tokens: PaginationPageToken[] = [];
    let previous = 0;

    for (const page of sorted) {
        if (previous > 0 && page - previous > 1) {
            tokens.push("ellipsis");
        }
        tokens.push(page);
        previous = page;
    }

    return tokens;
}
