/**
 * Build visible page tokens for a full-width table-style pager
 * (e.g. 1 2 3 … 8 9 10).
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

    // Near the start — mirror the reference: 1 2 3 … n-2 n-1 n
    if (current <= 3) {
        pages.add(2);
        pages.add(3);
        pages.add(totalPages - 2);
        pages.add(totalPages - 1);
    } else if (current >= totalPages - 2) {
        pages.add(2);
        pages.add(3);
        pages.add(totalPages - 2);
        pages.add(totalPages - 1);
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
