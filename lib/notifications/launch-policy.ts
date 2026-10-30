import { FEATURE_PLATFORM_OWNER } from "@/config";

/** Shared by HTTP notifications, socket delivery, and the dashboard feed. */
export function isLaunchEventVisible(
    event: {
        type?: string | null;
        referenceType?: string | null;
        relatedRepresentationId?: string | null;
        href?: string | null;
    },
    ownerEnabled = FEATURE_PLATFORM_OWNER,
): boolean {
    if (!isLaunchDestinationAllowed(event.href, ownerEnabled)) return false;
    if (ownerEnabled) return true;
    if (event.relatedRepresentationId) return false;
    const kind = `${event.type ?? ""} ${event.referenceType ?? ""}`.toLowerCase();
    if (
        /represent|invite|referral|credit|team|chat|message|owner|(?:^|\s)(?:broker_)?request(?:_|\s|$)/.test(
            kind,
        )
    )
        return false;
    return true;
}

export function isLaunchDestinationAllowed(
    href: string | null | undefined,
    ownerEnabled = FEATURE_PLATFORM_OWNER,
): boolean {
    if (!href) return true;
    // Notifications must never navigate to external or executable URLs.
    if (!href.startsWith("/") || href.startsWith("//") || /[\\\\\u0000-\u0020]/.test(href))
        return false;
    let url: URL;
    let path: string;
    try {
        url = new URL(href, "https://notification.local");
        path = decodeURIComponent(url.pathname);
    } catch {
        return false;
    }
    if (ownerEnabled) return true;
    return (
        !/^\/owner(?:\/|$)/.test(path) &&
        !/^\/broker\/(?:owner-listings|owners|my-deals|referrals|chat|messages)(?:\/|$)/.test(
            path,
        ) &&
        !(
            /^\/broker\/(?:your-listings|my-properties)(?:\/|$)/.test(path) &&
            url.searchParams.get("tab") === "requests"
        )
    );
}
