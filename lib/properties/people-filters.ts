export type PeopleFilters = { ownerId?: string; clientId?: string };
export type PeopleFilterScope = "my-listings" | "pipeline";
export type FilterPerson = { id: string; name: string };
export type PeopleFilterOptions = { owners: FilterPerson[]; clients: FilterPerson[] };

/** Match stable identities; owner and client selections are combined with AND. */
export function matchesPeopleFilters(
    ownerId: string | null | undefined,
    clients: readonly { id: string }[],
    filters: PeopleFilters,
): boolean {
    return (
        (!filters.ownerId || ownerId === filters.ownerId) &&
        (!filters.clientId || clients.some((client) => client.id === filters.clientId))
    );
}

export function collectPeopleFilterOptions(
    rows: { owner?: FilterPerson | null; clients: readonly FilterPerson[] }[],
): PeopleFilterOptions {
    const owners = new Map<string, FilterPerson>();
    const clients = new Map<string, FilterPerson>();
    for (const row of rows) {
        if (row.owner?.id) owners.set(row.owner.id, row.owner);
        for (const client of row.clients) clients.set(client.id, client);
    }
    const sort = (map: Map<string, FilterPerson>) =>
        [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
    return { owners: sort(owners), clients: sort(clients) };
}
