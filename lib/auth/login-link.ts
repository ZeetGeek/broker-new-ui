/**
 * Testing aid: packs an email + password into one opaque `?t=` token for
 * `/login`, so the credentials are not readable or memorable in the URL.
 *
 * This is OBFUSCATION, not security. The key ships in the client bundle, so
 * anyone with the token and the code can decode it. Use test accounts only.
 *
 * Generate a link: `npx tsx scripts/make-login-link.ts <email> <password>`
 */

const OBFUSCATION_KEY = "yb-login-link-v1";

export type LoginLinkCredentials = {
    email: string;
    password: string;
};

function xorWithKey(bytes: Uint8Array): Uint8Array {
    const key = new TextEncoder().encode(OBFUSCATION_KEY);
    return bytes.map((byte, index) => byte ^ key[index % key.length]);
}

function toBase64Url(bytes: Uint8Array): string {
    let binary = "";
    bytes.forEach((byte) => {
        binary += String.fromCharCode(byte);
    });
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(token: string): Uint8Array {
    const base64 = token.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

export function encodeLoginLinkToken({ email, password }: LoginLinkCredentials): string {
    const json = JSON.stringify({ e: email, p: password });
    return toBase64Url(xorWithKey(new TextEncoder().encode(json)));
}

/** Returns null for anything that is not a well-formed token. */
export function decodeLoginLinkToken(token: string): LoginLinkCredentials | null {
    try {
        const json = new TextDecoder().decode(xorWithKey(fromBase64Url(token)));
        const parsed: unknown = JSON.parse(json);
        if (
            typeof parsed === "object" &&
            parsed !== null &&
            "e" in parsed &&
            "p" in parsed &&
            typeof parsed.e === "string" &&
            typeof parsed.p === "string" &&
            parsed.e &&
            parsed.p
        ) {
            return { email: parsed.e, password: parsed.p };
        }
        return null;
    } catch {
        return null;
    }
}
