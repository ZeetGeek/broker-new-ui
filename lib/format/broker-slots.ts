export function brokerSlotsLabel(openCount: number, totalCount: number): string {
    const slotWord = openCount === 1 ? "slot" : "slots";
    return `${openCount} of ${totalCount} broker ${slotWord} open`;
}
