/** Encode two-phase browse cursor: serviceable pages first, then anywhere. */
export function encodeOwnerListingsCursor(phase: "serviceable" | "anywhere", page: number): string {
    return `${phase === "serviceable" ? "s" : "a"}:${page}`;
}

export function parseOwnerListingsCursor(cursor: string | null | undefined): {
    phase: "serviceable" | "anywhere";
    page: number;
} {
    const raw = cursor?.trim() ?? "";
    if (!raw) {
        return { phase: "serviceable", page: 1 };
    }

    const match = /^(s|a):(\d+)$/.exec(raw);
    if (match) {
        return {
            phase: match[1] === "a" ? "anywhere" : "serviceable",
            page: Math.max(1, Number(match[2]) || 1),
        };
    }

    // Legacy numeric page cursors (pre two-phase).
    const page = Math.max(1, Number(raw) || 1);
    return { phase: "serviceable", page };
}
