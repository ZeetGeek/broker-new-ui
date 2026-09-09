/**
 * WhatsApp deep link, optionally addressed to one number.
 *
 * `wa.me/<number>` opens that person's thread directly, which is the whole
 * point on a phone — the broker taps once and the message is sitting in the
 * right chat. Without a number it opens the contact picker, which is the
 * desktop and "share to anyone" case.
 */
export function buildWhatsAppInviteUrl(message: string, phoneDigits?: string): string {
    const text = encodeURIComponent(message);
    if (!phoneDigits) return `https://wa.me/?text=${text}`;
    // India country code. Numbers are stored as 10 digits throughout.
    return `https://wa.me/91${phoneDigits}?text=${text}`;
}

/**
 * SMS link. The `?body=` separator is `&` on iOS and `?` elsewhere, and
 * getting it wrong drops the message body silently — so both are written the
 * way each platform expects rather than guessed once.
 */
export function buildSmsInviteUrl(message: string, phoneDigits?: string): string {
    const to = phoneDigits ? `+91${phoneDigits}` : "";
    const body = encodeURIComponent(message);
    const isAppleDevice =
        typeof navigator !== "undefined" && /iP(hone|ad|od)|Mac/.test(navigator.userAgent);
    return `sms:${to}${isAppleDevice ? "&" : "?"}body=${body}`;
}
