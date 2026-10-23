/** Keep every picker and the upload serializer within the current upload limit. */
export const MAX_PROPERTY_PHOTOS = 10;

export function isUsablePropertyPhoto(photo: { status: string; url: string }): boolean {
    return photo.status !== "error" && photo.status !== "processing" && Boolean(photo.url);
}
