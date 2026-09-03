import { APP_NAME, SITE_URL } from "@/config";

export type PropertyShareInput = {
    id: string;
    title: string;
    locality: string;
    city: string;
    priceLabel: string;
    /** Optional cover photo for the share preview card. */
    imageSrc?: string | null;
    /** e.g. "2 BHK" / "Shop" config line from the listing. */
    configLabel?: string;
    propertyTypeLabel?: string;
    areaSqft?: number;
    bhk?: number;
    /** Whether the shared price is rent or sale. */
    listingKind?: "sale" | "rent";
};

/** Public listing URL brokers can share with clients. */
export function buildPropertyShareUrl(propertyId: string): string {
    return `${SITE_URL}/property/${propertyId}`;
}

export function buildPropertyShareText(input: PropertyShareInput): string {
    return `${input.title} · ${input.locality}, ${input.city} · ${input.priceLabel} — view on ${APP_NAME}`;
}

export function buildWhatsAppShareUrl(url: string, text: string): string {
    return `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`;
}

export function buildTelegramShareUrl(url: string, text: string): string {
    return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
}

export function buildFacebookShareUrl(url: string): string {
    return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
}

export function buildMessengerShareUrl(url: string): string {
    // Facebook's public share dialog app id — required by the send dialog.
    const appId = "966242223397117";
    return `https://www.facebook.com/dialog/send?link=${encodeURIComponent(url)}&redirect_uri=${encodeURIComponent(url)}&app_id=${appId}`;
}

export function buildXShareUrl(url: string, text: string): string {
    return `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
}

export function buildSlackShareUrl(url: string, text: string): string {
    return `https://slack.com/share?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
}

export function buildLinkedInShareUrl(url: string): string {
    return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
}

export function buildEmailShareUrl(url: string, text: string): string {
    const subject = encodeURIComponent(`Property listing — ${APP_NAME}`);
    const body = encodeURIComponent(`${text}\n\n${url}`);
    return `mailto:?subject=${subject}&body=${body}`;
}
