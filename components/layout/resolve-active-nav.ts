import type { NavItem } from "@/config/nav";

export function resolveActiveNavHref(pathname: string, items: NavItem[]): string | null {
    let match: string | null = null;
    let matchPrefixLength = 0;

    for (const item of items) {
        const prefixes = [item.href, ...(item.activePrefixes ?? [])];

        for (const prefix of prefixes) {
            if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
                if (prefix.length > matchPrefixLength) {
                    matchPrefixLength = prefix.length;
                    match = item.href;
                }
            }
        }
    }

    return match;
}
