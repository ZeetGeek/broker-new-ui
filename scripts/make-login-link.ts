/**
 * Prints an auto-login URL for a TEST account.
 *
 *   npx tsx scripts/make-login-link.ts <email> <password> [baseUrl] [next]
 *
 * See lib/auth/login-link.ts — the token is obfuscated, not encrypted.
 */
import { encodeLoginLinkToken } from "../lib/auth/login-link";

const [email, password, baseUrl = "http://localhost:3000", next] = process.argv.slice(2);

if (!email || !password) {
    console.error("Usage: npx tsx scripts/make-login-link.ts <email> <password> [baseUrl] [next]");
    process.exit(1);
}

const url = new URL("/login", baseUrl);
url.searchParams.set("t", encodeLoginLinkToken({ email, password }));
if (next) url.searchParams.set("next", next);

console.log(url.toString());
