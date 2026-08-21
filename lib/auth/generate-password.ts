const LETTERS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const NUMBERS = "0123456789";
const ALPHANUMERIC = LETTERS + NUMBERS;

function randomIndex(max: number): number {
    const buffer = new Uint32Array(1);
    crypto.getRandomValues(buffer);
    return buffer[0]! % max;
}

function pick(charset: string): string {
    return charset[randomIndex(charset.length)]!;
}

/** Strong enough for signup rules: 12 chars, at least one letter and one number. */
export function generatePassword(length = 12): string {
    const size = Math.max(length, 8);
    const chars: string[] = [pick(LETTERS), pick(NUMBERS)];

    for (let i = chars.length; i < size; i += 1) {
        chars.push(pick(ALPHANUMERIC));
    }

    for (let i = chars.length - 1; i > 0; i -= 1) {
        const j = randomIndex(i + 1);
        const temp = chars[i]!;
        chars[i] = chars[j]!;
        chars[j] = temp;
    }

    return chars.join("");
}
