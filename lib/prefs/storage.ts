/** Versioned localStorage payload for UI prefs. */
export type PrefPayload<T> = {
    v: 1;
    data: T;
};

const CHANGE_EVENT = "yb:prefs-change";

type PrefChangeDetail = { key: string };

function isPrefPayload(value: unknown): value is PrefPayload<unknown> {
    return (
        typeof value === "object" &&
        value !== null &&
        "v" in value &&
        (value as PrefPayload<unknown>).v === 1 &&
        "data" in value
    );
}

export function readPrefJson<T>(
    key: string,
    fallback: T,
    isValid?: (value: unknown) => value is T,
): T {
    if (typeof window === "undefined") return fallback;

    try {
        const raw = window.localStorage.getItem(key);
        if (!raw) return fallback;

        const parsed: unknown = JSON.parse(raw);
        const data = isPrefPayload(parsed) ? parsed.data : parsed;

        if (isValid) {
            return isValid(data) ? data : fallback;
        }

        return data as T;
    } catch {
        return fallback;
    }
}

export function writePrefJson<T>(key: string, data: T): void {
    if (typeof window === "undefined") return;

    const payload: PrefPayload<T> = { v: 1, data };
    window.localStorage.setItem(key, JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent<PrefChangeDetail>(CHANGE_EVENT, { detail: { key } }));
    // Cross-tab listeners still use the native `storage` event.
}

export function removePref(key: string): void {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(key);
    window.dispatchEvent(new CustomEvent<PrefChangeDetail>(CHANGE_EVENT, { detail: { key } }));
}

/** Subscribe to same-tab pref writes and cross-tab `storage` events for one key. */
export function subscribePref(key: string, onStoreChange: () => void): () => void {
    const onCustom = (event: Event) => {
        const detail = (event as CustomEvent<PrefChangeDetail>).detail;
        if (detail?.key === key) onStoreChange();
    };
    const onStorage = (event: StorageEvent) => {
        if (event.key === key || event.key === null) onStoreChange();
    };

    window.addEventListener(CHANGE_EVENT, onCustom);
    window.addEventListener("storage", onStorage);
    return () => {
        window.removeEventListener(CHANGE_EVENT, onCustom);
        window.removeEventListener("storage", onStorage);
    };
}

/** One-shot migration: copy a legacy plain string/JSON value into the versioned key. */
export function migrateLegacyPref(
    legacyKey: string,
    nextKey: string,
    map?: (raw: string) => unknown,
): void {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(nextKey)) return;

    const raw = window.localStorage.getItem(legacyKey);
    if (raw == null) return;

    try {
        const data = map ? map(raw) : JSON.parse(raw);
        writePrefJson(nextKey, data);
    } catch {
        if (map) {
            try {
                writePrefJson(nextKey, map(raw));
            } catch {
                // Ignore unreadable legacy values.
            }
        }
    }
}
