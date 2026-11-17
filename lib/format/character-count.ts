const COUNT_FORMAT = new Intl.NumberFormat("en-IN");

/** "21 / 500 characters" — the counter under a length-limited text field. */
export function formatCharacterCount(length: number, maxChars: number): string {
    return `${COUNT_FORMAT.format(length)} / ${COUNT_FORMAT.format(maxChars)} characters`;
}
