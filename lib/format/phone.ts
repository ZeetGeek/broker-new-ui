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
