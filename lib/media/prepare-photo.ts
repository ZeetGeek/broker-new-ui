const TARGET_BYTES = 300 * 1024;
const MAX_EDGE = 1_800;

function canvasBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error("Photo compression failed."))),
            "image/webp",
            quality,
        );
    });
}

export async function preparePhotoForUpload(file: File): Promise<File> {
    const bitmap = await createImageBitmap(file);
    try {
        const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(bitmap.width * scale));
        canvas.height = Math.max(1, Math.round(bitmap.height * scale));
        const context = canvas.getContext("2d", { alpha: false });
        if (!context) throw new Error("Photo processing is not available on this device.");
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

        let quality = 0.82;
        let blob = await canvasBlob(canvas, quality);
        while (blob.size > TARGET_BYTES && quality > 0.42) {
            quality -= 0.08;
            blob = await canvasBlob(canvas, quality);
        }
        const baseName = file.name.replace(/\.[^.]+$/, "") || "property-photo";
        return new File([blob], `${baseName}.webp`, {
            type: "image/webp",
            lastModified: file.lastModified,
        });
    } finally {
        bitmap.close();
    }
}
