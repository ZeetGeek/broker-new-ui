import type { PropertyDraftValues } from "@/lib/schemas/property";

import type { MyListingItem } from "@/features/properties/your-listings/types";

export type PendingBuyerAttachment = {
    listing: MyListingItem;
    buyerIds: string[];
    draft: boolean;
};

type DraftUi = {
    step?: string;
    highestUnlocked?: number;
    entryMode?: "full" | "quick";
    completedSteps?: string[];
};

export type StoredPropertyDraft = {
    savedAt: string;
    values: PropertyDraftValues;
    ui?: DraftUi;
    pendingAttachment?: PendingBuyerAttachment | null;
};

type DraftRecord = StoredPropertyDraft & { files: { id: string; file: File }[] };
const DATABASE = "property-form-drafts";
const STORE = "drafts";
const pendingWrites = new Map<string, Promise<unknown>>();

export function propertyDraftKey(
    accountId: string,
    portal: "owner" | "broker",
    propertyId = "new",
    kind: "draft" | "extra" = "draft",
): string {
    return `property-${kind}:v10:${encodeURIComponent(accountId)}:${portal}:${propertyId}`;
}

async function withStore<T>(
    mode: IDBTransactionMode,
    action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(DATABASE, 1);
        request.onupgradeneeded = () => request.result.createObjectStore(STORE);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        request.onblocked = () => reject(new Error("Local photo storage is busy."));
    });
    try {
        return await new Promise<T>((resolve, reject) => {
            const transaction = database.transaction(STORE, mode);
            const request = action(transaction.objectStore(STORE));
            transaction.oncomplete = () => resolve(request.result);
            transaction.onabort = () => reject(transaction.error);
            transaction.onerror = () => reject(transaction.error);
        });
    } finally {
        database.close();
    }
}

function enqueue<T>(key: string, action: () => Promise<T>): Promise<T> {
    const result = (pendingWrites.get(key) ?? Promise.resolve()).catch(() => {}).then(action);
    pendingWrites.set(key, result);
    void result
        .finally(() => {
            if (pendingWrites.get(key) === result) pendingWrites.delete(key);
        })
        .catch(() => {});
    return result;
}

/** Blob URLs expire on reload. Store the actual files with their photo IDs instead. */
export function savePropertyDraft(
    key: string,
    draft: StoredPropertyDraft,
    photoFiles: Map<string, File>,
): Promise<void> {
    const record: DraftRecord = { ...structuredClone(draft), files: [] };
    for (const photo of record.values.media.photos) {
        if (!photo.url.startsWith("blob:")) continue;
        const file = photoFiles.get(photo.id) ?? photoFiles.get(photo.url);
        if (!file)
            return Promise.reject(
                new Error(
                    "A photo is no longer available. Choose it again before saving this draft.",
                ),
            );
        record.files.push({ id: photo.id, file });
        photo.url = "";
    }
    return enqueue(key, async () => {
        let storedPhotos = false;
        try {
            await withStore("readwrite", (store) => store.put(record, key));
            storedPhotos = true;
        } catch {
            // Text-only drafts still work when IndexedDB is unavailable.
        }
        const fallback = structuredClone(record);
        fallback.files = [];
        fallback.values.media.photos = fallback.values.media.photos.filter((photo) => photo.url);
        try {
            localStorage.setItem(key, JSON.stringify(fallback));
        } catch {
            if (!storedPhotos) throw new Error("This device could not save your draft.");
        }
        if (record.files.length && !storedPhotos) {
            throw new Error(
                "Text saved, but photos could not be saved on this device. Keep this form open or save the property before leaving.",
            );
        }
    });
}

export async function loadPropertyDraft(
    key: string,
    photoFiles: Map<string, File>,
): Promise<StoredPropertyDraft | null> {
    await pendingWrites.get(key)?.catch(() => {});
    let record: DraftRecord | undefined;
    try {
        record = await withStore("readonly", (store) => store.get(key));
    } catch {
        // Fall back to the text copy.
    }
    try {
        const text = localStorage.getItem(key);
        const fallback = text ? (JSON.parse(text) as DraftRecord) : null;
        if (
            fallback &&
            (!record ||
                fallback.savedAt > record.savedAt ||
                (!fallback.values && fallback.savedAt >= record.savedAt))
        )
            record = fallback;
    } catch {
        // A malformed or unavailable text copy must not hide the IndexedDB draft.
    }
    if (!record?.values) return null;
    const files = new Map((record.files ?? []).map(({ id, file }) => [id, file]));
    record.values.media.photos = record.values.media.photos.flatMap((photo) => {
        const file = files.get(photo.id);
        if (!file) return photo.url && !photo.url.startsWith("blob:") ? [photo] : [];
        const url = URL.createObjectURL(file);
        photoFiles.set(photo.id, file);
        photoFiles.set(url, file);
        return [
            {
                ...photo,
                url,
                status: photo.status === "error" ? ("error" as const) : ("queued" as const),
            },
        ];
    });
    return record;
}

export function removePropertyDraft(key: string): Promise<void> {
    return enqueue(key, async () => {
        try {
            await withStore("readwrite", (store) => store.delete(key));
        } catch {
            // Keep a deletion marker so an inaccessible older photo draft cannot return later.
            localStorage.setItem(
                key,
                JSON.stringify({ savedAt: new Date().toISOString(), values: null }),
            );
            return;
        }
        localStorage.removeItem(key);
    });
}
