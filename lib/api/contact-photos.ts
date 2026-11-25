import { apiFetch } from "@/lib/api/client";
import { isMockMode } from "@/lib/api/mock-mode";
import { withTestNetwork } from "@/lib/testing/test-network";

export type ContactPhotoUpload = {
    /** Storage key — send as `avatarKey` when saving the client or owner. */
    key: string;
    /** Public URL the photo will be served from. */
    url: string;
};

/**
 * Photos a broker adds to their own clients and owners.
 *
 * Upload runs before the contact is saved, so a failed upload leaves nothing
 * half-saved and the form keeps its input.
 */
export const contactPhotosApi = withTestNetwork({
    async upload(file: File): Promise<ContactPhotoUpload> {
        if (isMockMode()) {
            const url = URL.createObjectURL(file);
            return { key: url, url };
        }
        const form = new FormData();
        form.append("file", file, file.name || "photo.jpg");
        return apiFetch<ContactPhotoUpload>("/clients/photo", {
            method: "POST",
            body: form,
        });
    },
});
