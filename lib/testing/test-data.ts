import { getTestLabSettings, isTestSampleMode } from "./test-lab";

type DataScope = "workspace" | "marketplace";

const LOCATION_IDS = new Set(["countryId", "stateId", "cityId", "localityId"]);
const isId = (key: string) => (key === "id" || key.endsWith("Id")) && !LOCATION_IDS.has(key);

/** Stable IDs and foreign keys share a suffix, so expanded records still open and link. */
export function cloneTestRecord<T>(value: T, copy: number, edgeCases = false): T {
    function visit(input: unknown, key = ""): unknown {
        if (Array.isArray(input)) {
            if (edgeCases && ["photos", "imageSrcs", "imageUrls"].includes(key)) return [];
            return input.map((item) => visit(item, key));
        }
        if (input && typeof input === "object")
            return Object.fromEntries(
                Object.entries(input).map(([name, item]) => [name, visit(item, name)]),
            );
        if (typeof input !== "string") return input;
        if (copy > 0 && isId(key) && input) return `${input}__test${copy}`;
        if (["name", "fullName", "ownerName", "clientName", "title"].includes(key)) {
            const label = copy > 0 ? `${input} ${copy + 1}` : input;
            if (edgeCases)
                return `${label} · A very long sample name to check wrapping on a small phone screen`.slice(
                    0,
                    155,
                );
            // Task titles may already use all 160 characters before a copy suffix is added.
            return key === "title" ? label.slice(0, 160).trimEnd() : label;
        }
        if (edgeCases && ["avatarUrl", "imageSrc", "coverUrl", "coverImage"].includes(key))
            return "";
        return input;
    }
    return visit(value) as T;
}

/** Apply before filtering/pagination, never to a page of results. */
export function testData<T>(seed: T[], _scope: DataScope = "workspace"): T[] {
    if (!isTestSampleMode()) return seed;
    const settings = getTestLabSettings();
    if (settings.volume === "empty") return [];
    if (seed.length === 0) return [];
    const target =
        settings.volume === "less"
            ? Math.min(3, seed.length)
            : settings.volume === "stress"
              ? 300
              : Math.max(30, seed.length);
    return Array.from({ length: target }, (_, index) => {
        const original = seed[index % seed.length];
        const cloned = cloneTestRecord(
            original,
            Math.floor(index / seed.length),
            settings.edgeCases && index % 3 === 1,
        );
        // Task catalogs are shared reference data, not copies of each task's records.
        if (original && typeof original === "object" && "deliveredReminderKeys" in original) {
            for (const key of ["clientId", "propertyId", "ownerId", "listId"]) {
                Object.assign(cloned as object, {
                    [key]: (original as Record<string, unknown>)[key],
                });
            }
        }
        return cloned;
    });
}

/** Empty aggregate payloads while retaining structural stage rows and configuration. */
export function emptyTestSnapshot<T>(value: T, key = ""): T {
    if (Array.isArray(value)) {
        if (["stages", "pipeline", "pipelineFunnel", "firstWeekItems"].includes(key))
            return value.map((item) => emptyTestSnapshot(item, key)) as T;
        return [] as T;
    }
    if (value && typeof value === "object")
        return Object.fromEntries(
            Object.entries(value).map(([name, item]) => [
                name,
                name === "remaining" && "limit" in value && typeof value.limit === "number"
                    ? value.limit
                    : name === "nextShowing" || name === "stalled"
                      ? null
                      : emptyTestSnapshot(item, name),
            ]),
        ) as T;
    if (
        typeof value === "number" &&
        !["limit", "thresholdDays", "page", "totalPages"].includes(key)
    )
        return 0 as T;
    if (key === "isComplete") return false as T;
    return value;
}

export function testSnapshot<T>(value: T, _scope: DataScope = "workspace"): T {
    const settings = getTestLabSettings();
    if (!isTestSampleMode()) return value;
    if (settings.volume === "empty") return emptyTestSnapshot(value);
    return value;
}

export function testRelationMap(seed: Record<string, string[]>): Record<string, string[]> {
    if (!isTestSampleMode()) return seed;
    const settings = getTestLabSettings();
    if (settings.volume === "empty") return {};
    const copies = settings.volume === "stress" ? 100 : settings.volume === "more" ? 10 : 1;
    return Object.fromEntries(
        Array.from({ length: copies }, (_, copy) =>
            Object.entries(seed).map(([id, values]) => [
                copy ? `${id}__test${copy}` : id,
                values.map((value) => (copy ? `${value}__test${copy}` : value)),
            ]),
        ).flat(),
    );
}
