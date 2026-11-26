/** A fact and its shorter phone wording, kept together as the data changes. */
export type PageSummaryLine = { text: string; mobile: string };

export function summaryLine(text: string, mobile = text): PageSummaryLine {
    return { text, mobile };
}

export function summaryCount(value: number, noun: string, plural = `${noun}s`): string {
    return `${new Intl.NumberFormat("en-IN").format(value)} ${value === 1 ? noun : plural}`;
}
