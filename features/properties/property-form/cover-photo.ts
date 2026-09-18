"use client";

import type { MutableRefObject } from "react";
import toast from "react-hot-toast";

import { createClientId } from "@/lib/client-id";
import { preparePhotoForUpload } from "@/lib/media/prepare-photo";
import type { PropertyDraftValues } from "@/lib/schemas/property";

export type DraftPhoto = PropertyDraftValues["media"]["photos"][number];

const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

export function normalizePhotoOrder(list: DraftPhoto[]): DraftPhoto[] {
    const cover = list.find((photo) => photo.isCover);
    const gallery = list.filter((photo) => !photo.isCover);
    return [...(cover ? [cover] : []), ...gallery].map((photo, order) => ({ ...photo, order }));
}

function isPortraitImage(file: File): Promise<boolean> {
    return new Promise((resolve) => {
        const url = URL.createObjectURL(file);
        const img = new window.Image();
        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(img.naturalHeight > img.naturalWidth);
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve(true);
        };
        img.src = url;
    });
}

function revokePhoto(
    photo: DraftPhoto | null | undefined,
    photoFilesRef: MutableRefObject<Map<string, File>>,
) {
    if (!photo) return;
    if (photo.url.startsWith("blob:")) {
        URL.revokeObjectURL(photo.url);
        photoFilesRef.current.delete(photo.url);
    }
    photoFilesRef.current.delete(photo.id);
}

function buildCoverEntry(
    file: File,
    photoFilesRef: MutableRefObject<Map<string, File>>,
): DraftPhoto {
    const id = createClientId("photo");
    if (file.size > MAX_PHOTO_BYTES) {
        photoFilesRef.current.set(id, file);
        return {
            id,
            url: "",
            name: file.name,
            tag: "cover",
            isCover: true,
            order: 0,
            alt: "",
            status: "error",
            errorMessage: "File is larger than 10 MB. Choose a smaller copy.",
        };
    }
    if (!PHOTO_TYPES.has(file.type)) {
        photoFilesRef.current.set(id, file);
        return {
            id,
            url: "",
            name: file.name,
            tag: "cover",
            isCover: true,
            order: 0,
            alt: "",
            status: "error",
            errorMessage: "Use a JPG, PNG, WebP, HEIC, or HEIF photo.",
        };
    }
    const url = URL.createObjectURL(file);
    photoFilesRef.current.set(url, file);
    photoFilesRef.current.set(id, file);
    return {
        id,
        url,
        name: file.name,
        tag: "cover",
        isCover: true,
        order: 0,
        alt: "",
        status: "processing",
    };
}

async function processCoverPhoto(
    photoId: string,
    file: File,
    url: string,
    photoFilesRef: MutableRefObject<Map<string, File>>,
    patchPhoto: (photoId: string, patch: Partial<DraftPhoto>) => void,
) {
    patchPhoto(photoId, { status: "processing" });
    try {
        const prepared = await preparePhotoForUpload(file);
        photoFilesRef.current.set(photoId, prepared);
        photoFilesRef.current.set(url, prepared);
        patchPhoto(photoId, { status: "queued", name: prepared.name });
    } catch {
        patchPhoto(photoId, {
            status: "error",
            errorMessage: "This photo could not be compressed on this device.",
        });
    }
}

/** Replace the listing cover photo. Gallery photos are kept. */
export async function replaceCoverPhoto({
    file,
    photos,
    photoFilesRef,
    commitPhotos,
    patchPhoto,
}: {
    file: File;
    photos: DraftPhoto[];
    photoFilesRef: MutableRefObject<Map<string, File>>;
    commitPhotos: (next: DraftPhoto[]) => void;
    patchPhoto: (photoId: string, patch: Partial<DraftPhoto>) => void;
}): Promise<void> {
    const portrait = await isPortraitImage(file);
    if (!portrait) {
        toast.error("Cover works best as a vertical photo (taller than wide).");
    }
    const currentCover = photos.find((photo) => photo.isCover) ?? null;
    revokePhoto(currentCover, photoFilesRef);
    const entry = buildCoverEntry(file, photoFilesRef);
    const gallery = photos.filter((photo) => !photo.isCover);
    commitPhotos(normalizePhotoOrder([entry, ...gallery]));
    if (entry.url) void processCoverPhoto(entry.id, file, entry.url, photoFilesRef, patchPhoto);
}

/** Remove the listing cover photo. Gallery photos are kept. */
export function removeCoverPhoto({
    photos,
    photoFilesRef,
    commitPhotos,
}: {
    photos: DraftPhoto[];
    photoFilesRef: MutableRefObject<Map<string, File>>;
    commitPhotos: (next: DraftPhoto[]) => void;
}): void {
    const currentCover = photos.find((photo) => photo.isCover) ?? null;
    if (!currentCover) return;
    revokePhoto(currentCover, photoFilesRef);
    commitPhotos(normalizePhotoOrder(photos.filter((photo) => !photo.isCover)));
}
