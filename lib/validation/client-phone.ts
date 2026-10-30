import {
    type CountryCode,
    getCountryCallingCode,
    isSupportedCountry,
    parsePhoneNumberFromString,
} from "libphonenumber-js/max";

export function clientPhoneCountry(iso2?: string | null): CountryCode | undefined {
    const code = iso2?.toUpperCase();
    return code && isSupportedCountry(code) ? (code as CountryCode) : undefined;
}

/** Validate the exact country, including countries sharing a calling code. */
export function parseClientMobile(value: string, iso2?: string | null) {
    const country = clientPhoneCountry(iso2);
    if (!country) return undefined;
    const phone = parsePhoneNumberFromString(value, { defaultCountry: country, extract: false });
    if (!phone || phone.country !== country || phone.ext || !phone.isValid()) return undefined;
    const type = phone.getType();
    return type === "MOBILE" || type === "FIXED_LINE_OR_MOBILE" ? phone : undefined;
}

export function clientCallingCode(iso2?: string | null): string | undefined {
    const country = clientPhoneCountry(iso2);
    return country ? `+${getCountryCallingCode(country)}` : undefined;
}

/** Keep legacy Indian national digits; retain the full international number elsewhere. */
export function clientPhoneForStorage(value: string, iso2: string): string {
    const phone = parseClientMobile(value, iso2);
    if (!phone) throw new Error("Enter a valid mobile number for your account’s country.");
    return phone.country === "IN" ? phone.nationalNumber : phone.number;
}
