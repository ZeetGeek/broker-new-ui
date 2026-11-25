"use client";

import { useCallback, useRef } from "react";

import { contactPhotosApi } from "@/lib/api/contact-photos";

/**
 * Uploads a picked contact photo once and returns its storage key.
 *
 * Remembers the last upload, so retrying a save that failed for another
 * reason (duplicate phone, network) does not upload the same photo again.
 */
export function useContactPhotoKey() {
    const lastUpload = useRef<{ file: File; key: string } | null>(null);

    return useCallback(async (file: File): Promise<string> => {
        if (lastUpload.current?.file === file) return lastUpload.current.key;
        try {
            const { key } = await contactPhotosApi.upload(file);
            lastUpload.current = { file, key };
            return key;
        } catch {
            throw new Error(
                "The photo didn’t upload. Check your connection and try again, or remove the photo to save without it.",
            );
        }
    }, []);
}
