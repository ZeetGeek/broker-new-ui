/** "1 deal" / "3 deals". Pass `many` for irregular plurals. */
export function plural(n: number, one: string, many = `${one}s`): string {
    return `${n} ${n === 1 ? one : many}`;
}
