/** Display formatting only. Keep the original spelling in forms and API writes. */
export function formatPersonName(value: string | null | undefined): string {
    return (value ?? "")
        .trim()
        .replace(/\s+/g, " ")
        .replace(/[\p{L}\p{M}]+/gu, (word) => {
            // Preserve initials, acronyms and intentionally mixed-case names.
            const letters = [...word];
            if (word === word.toUpperCase() && letters.length <= 3) return word;
            const rest = word === word.toUpperCase() ? word.toLowerCase() : word;
            return rest.charAt(0).toUpperCase() + rest.slice(1);
        });
}
