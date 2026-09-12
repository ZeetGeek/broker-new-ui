let clientSequence = 0;

export function createClientId(prefix: string): string {
    clientSequence += 1;
    return `${prefix}-${clientSequence}`;
}
