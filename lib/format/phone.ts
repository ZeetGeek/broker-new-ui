function nationalTenDigits(phoneDigits: string): string {
    const digits = phoneDigits.replace(/\D/g, "");
    if (digits.length === 12 && digits.startsWith("91")) {
        return digits.slice(2);
    }
    return digits.slice(-10);
}

/** Display form `+91 XXXXX XXXXX`. */
export function formatPhoneIn(phoneDigits: string): string {
    const ten = nationalTenDigits(phoneDigits);
    if (ten.length !== 10) {
        return phoneDigits;
    }
    return `+91 ${ten.slice(0, 5)} ${ten.slice(5)}`;
}

/** Masked form. Last four digits stay visible. */
export function formatMaskedPhoneIn(phoneDigits: string): string {
    const formatted = formatPhoneIn(phoneDigits);
    if (formatted === phoneDigits) {
        return phoneDigits;
    }
    return formatted.replace(/\d(?=\d{4})/g, "•");
}

/** WhatsApp deep link for an Indian mobile number. */
export function formatWhatsAppUrl(phoneDigits: string, text?: string): string {
    const digits = phoneDigits.replace(/\D/g, "");
    const e164 = digits.length === 10 ? `91${digits}` : digits;
    const base = `https://wa.me/${e164}`;
    if (!text?.trim()) return base;
    return `${base}?text=${encodeURIComponent(text.trim())}`;
}

/** `tel:` link for an Indian mobile number. */
export function formatTelUrl(phoneDigits: string): string {
    const digits = phoneDigits.replace(/\D/g, "");
    const ten =
        digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits.slice(-10);
    return ten.length === 10 ? `tel:+91${ten}` : `tel:${digits}`;
}
