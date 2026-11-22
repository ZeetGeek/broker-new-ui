import { formatPersonName } from "@/lib/format/person-name";
/** Counts each client once, including when saved and newly selected clients overlap. */
export function summarizeAttachedClients<T extends { id: string; name: string }>(
    clients: readonly T[],
    maxVisible = 2,
) {
    const unique = [...new Map(clients.map((client) => [client.id, client])).values()];
    return {
        total: unique.length,
        visibleClients: unique.slice(0, maxVisible),
        label: unique.length === 1 ? formatPersonName(unique[0]!.name) : `${unique.length} clients`,
        names: unique.map((client) => formatPersonName(client.name)).join(", "),
    };
}
