export type PersonDetailsTarget =
    | { kind: "contact"; type: "buyer" | "owner"; id?: string; name: string }
    | { kind: "owner-profile" | "broker-profile"; id: string; name: string };

/** Resolve existing person links without navigating or crossing portal boundaries. */
export function personDetailsTarget(
    href: string,
    name: string,
    portal: "broker" | "owner",
): PersonDetailsTarget | null {
    let url: URL;
    try {
        url = new URL(href, "https://app.local");
    } catch {
        return null;
    }
    if (url.origin !== "https://app.local") return null;
    if (portal === "broker" && url.pathname === "/broker/contacts") {
        const id = url.searchParams.get("contact") || undefined;
        if (!id && !url.searchParams.get("contactName")?.trim()) return null;
        const contactName = url.searchParams.get("contactName") || name;
        if (!id && !contactName.trim()) return null;
        return {
            kind: "contact",
            type: url.searchParams.get("tab") === "owners" ? "owner" : "buyer",
            id,
            name: contactName,
        };
    }
    const owner = url.pathname.match(/^\/broker\/owners\/([^/]+)\/?$/);
    if (portal === "broker" && owner) {
        try {
            return { kind: "owner-profile", id: decodeURIComponent(owner[1]), name };
        } catch {
            return null;
        }
    }
    const broker = url.searchParams.get("broker");
    if (portal === "owner" && url.pathname === "/owner/brokers" && broker) {
        return { kind: "broker-profile", id: broker, name };
    }
    return null;
}

/** Only ordinary in-app navigation calls this; modified clicks keep their native link behavior. */
export function openPersonDetails(
    href: string,
    name: string,
    onOpen: (() => void) | undefined,
    openShared: ((href: string, name: string) => boolean) | null,
): boolean {
    if (onOpen) {
        onOpen();
        return true;
    }
    return openShared?.(href, name) ?? false;
}
