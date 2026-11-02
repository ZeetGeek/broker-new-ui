"use client";

import { type SyntheticEvent, useCallback, useRef, useState } from "react";
import ReactCrop, { centerCrop, type Crop, makeAspectCrop, type PixelCrop } from "react-image-crop";

import { AppModalHeader } from "@/components/shared/app-modal-header";
import { CropIcon } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";
import { Dialog, DialogDescription, DialogPopup } from "@/components/ui/dialog";

import "react-image-crop/dist/ReactCrop.css";

const ASPECT = 1;
/** Output edge length for the avatar upload — keeps files small on phone data. */
const OUTPUT_SIZE_PX = 512;

export type ProfileImageCropperProps = {
    open: boolean;
    imageUrl: string | null;
    /** Original filename, used when building the cropped File. */
    fileName?: string;
    onOpenChange: (open: boolean) => void;
    /** Called with a square PNG ready for `profileApi.uploadAvatar`. */
    onCropped: (file: File) => void;
};

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number): Crop {
    return centerCrop(
        makeAspectCrop(
            {
                unit: "%",
                width: 90,
            },
            aspect,
            mediaWidth,
            mediaHeight,
        ),
        mediaWidth,
        mediaHeight,
    );
}

function canvasToFile(canvas: HTMLCanvasElement, fileName: string): Promise<File> {
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    reject(new Error("Could not crop that image. Try another photo."));
                    return;
                }
                const base = fileName.replace(/\.[^.]+$/, "") || "profile-photo";
                resolve(new File([blob], `${base}.png`, { type: "image/png" }));
            },
            "image/png",
            0.92,
        );
    });
}

async function getCroppedFile(
    image: HTMLImageElement,
    crop: PixelCrop,
    fileName: string,
): Promise<File> {
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const sourceWidth = crop.width * scaleX;
    const sourceHeight = crop.height * scaleY;

    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE_PX;
    canvas.height = OUTPUT_SIZE_PX;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
        throw new Error("Could not crop that image. Try another photo.");
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        OUTPUT_SIZE_PX,
        OUTPUT_SIZE_PX,
    );

    return canvasToFile(canvas, fileName);
}

/**
 * Square crop dialog for the profile photo.
 *
 * Opens after a file is picked. On confirm it returns a PNG File so the parent
 * can upload with the existing avatar API — no data-URL round trip.
 */
export function ProfileImageCropper({
    open,
    imageUrl,
    fileName = "profile-photo.png",
    onOpenChange,
    onCropped,
}: ProfileImageCropperProps) {
    const imgRef = useRef<HTMLImageElement | null>(null);
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const [isCropping, setIsCropping] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reset before rendering a new image, so a cached image load cannot race a timer.
    const [cropSource, setCropSource] = useState({ open, imageUrl });
    if (cropSource.open !== open || cropSource.imageUrl !== imageUrl) {
        setCropSource({ open, imageUrl });
        if (open) {
            setCrop(undefined);
            setCompletedCrop(undefined);
            setError(null);
            setIsCropping(false);
        }
    }

    const onImageLoad = useCallback((event: SyntheticEvent<HTMLImageElement>) => {
        const { width, height } = event.currentTarget;
        setCrop(centerAspectCrop(width, height, ASPECT));
    }, []);

    const handleConfirm = useCallback(async () => {
        const image = imgRef.current;
        if (!image || !completedCrop?.width || !completedCrop?.height) {
            setError("Drag the box to choose which part of the photo to keep.");
            return;
        }

        setIsCropping(true);
        setError(null);
        try {
            const file = await getCroppedFile(image, completedCrop, fileName);
            onCropped(file);
            onOpenChange(false);
        } catch (err) {
            setError(
                err instanceof Error && err.message
                    ? err.message
                    : "Could not crop that image. Try another photo.",
            );
        } finally {
            setIsCropping(false);
        }
    }, [completedCrop, fileName, onCropped, onOpenChange]);

    const handleCancel = useCallback(() => {
        onOpenChange(false);
    }, [onOpenChange]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogPopup className="gap-0 p-0 max-inline-lg" showCloseButton={false}>
                <AppModalHeader title="Crop your photo" />
                <DialogDescription className="px-(--dialog-pad) pbs-3">
                    Move and resize the square so your face sits in the centre.
                </DialogDescription>

                <div
                    className="
                  flex items-center justify-center bg-surface-muted p-4 min-block-72
                  sm:p-6
                "
                >
                    {imageUrl ? (
                        <ReactCrop
                            crop={crop}
                            onChange={(_, percentCrop) => setCrop(percentCrop)}
                            onComplete={(next) => setCompletedCrop(next)}
                            aspect={ASPECT}
                            circularCrop
                            className="max-inline-full"
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element -- blob/object URL from a local pick */}
                            <img
                                ref={imgRef}
                                src={imageUrl}
                                alt="Photo to crop"
                                onLoad={onImageLoad}
                                className="max-block-[min(60dvh,28rem)] max-inline-full"
                            />
                        </ReactCrop>
                    ) : null}
                </div>

                {error ? (
                    <p role="alert" className="body-sm px-5 text-danger">
                        {error}
                    </p>
                ) : null}

                <div
                    className="
                      flex flex-wrap items-center justify-end gap-3 border-bs border-border-warm
                      px-5 py-4
                    "
                >
                    <Button
                        type="button"
                        variant="outline"
                        size="md"
                        disabled={isCropping}
                        onClick={handleCancel}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        size="md"
                        loading={isCropping}
                        disabled={isCropping || !completedCrop}
                        onClick={() => void handleConfirm()}
                    >
                        <CropIcon aria-hidden />
                        {isCropping ? "Cropping…" : "Use this crop"}
                    </Button>
                </div>
            </DialogPopup>
        </Dialog>
    );
}
