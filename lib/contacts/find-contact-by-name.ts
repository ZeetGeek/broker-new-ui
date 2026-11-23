import { contactsApi } from "@/lib/api/contacts";

import { DEFAULT_CONTACTS_FILTERS } from "@/features/contacts/types";

export class AmbiguousContactNameError extends Error {
    constructor() {
        super(
            "Several contacts have this name. Close this panel and choose the correct person in Contacts.",
        );
        this.name = "AmbiguousContactNameError";
    }
}

const nameKey = (name: string) => name.trim().replace(/\s+/g, " ").normalize("NFC").toLowerCase();

/** Name-only links must never silently select the first of two different people. */
export async function findContactByName(
    name: string,
    type: "buyer" | "owner",
    signal?: AbortSignal,
) {
    const key = nameKey(name);
    if (!key) return null;
    const filters = { ...DEFAULT_CONTACTS_FILTERS, q: name.trim(), ownerOrigin: "all" as const };
    type Contact = NonNullable<Awaited<ReturnType<typeof contactsApi.findContact>>>;
    const matches = new Map<string, Contact>();
    let cursor: string | null = null;
    do {
        const page:
            | Awaited<ReturnType<typeof contactsApi.listBuyersPage>>
            | Awaited<ReturnType<typeof contactsApi.listOwnersPage>> =
            type === "buyer"
                ? await contactsApi.listBuyersPage(filters, cursor, signal)
                : await contactsApi.listOwnersPage(filters, cursor, signal);
        for (const row of page.items) {
            if (nameKey(row.name) !== key) continue;
            matches.set(row.id, { type, row } as Contact);
            if (matches.size > 1) throw new AmbiguousContactNameError();
        }
        cursor = page.nextCursor;
    } while (cursor);
    return matches.values().next().value ?? null;
}
