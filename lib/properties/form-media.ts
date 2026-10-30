/** Keep every picker and the upload serializer within the current upload limit. */
export const MAX_PROPERTY_PHOTOS = 10;

/** Matches listing cards and previews; stays below the photo processor's 1800px edge limit. */
export const PROPERTY_COVER_SIZE_GUIDANCE = "Best size: 1600 × 1200 px (4:3)";

export function isUsablePropertyPhoto(photo: { status: string; url: string }): boolean {
    return photo.status !== "error" && photo.status !== "processing" && Boolean(photo.url);
}
