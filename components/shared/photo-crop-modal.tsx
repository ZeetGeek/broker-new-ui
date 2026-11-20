"use client";

import {
    type CSSProperties,
    type SyntheticEvent,
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import ReactCrop, { centerCrop, makeAspectCrop, type PercentCrop } from "react-image-crop";

import { AppModalHeader } from "@/components/shared/app-modal-header";
import { Check, RotateCcw } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";
import { Dialog, DialogPopup } from "@/components/ui/dialog";

import "react-image-crop/dist/ReactCrop.css";
import styles from "./photo-crop-modal.module.css";

const ASPECT = 1;
/** Output edge length for the avatar upload — keeps files small on phone data. */
const OUTPUT_SIZE_PX = 512;

export type PhotoCropModalProps = {
    open: boolean;
    imageUrl: string | null;
    /** Original filename, used when building the cropped File. */
    fileName?: string;
    onOpenChange: (open: boolean) => void;
    /** Called with a square PNG ready for `profileApi.uploadAvatar`. */
    onCropped: (file: File) => void;
};

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number): PercentCrop {
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
    crop: PercentCrop,
    fileName: string,
): Promise<File> {
    const sourceWidth = (crop.width / 100) * image.naturalWidth;
    const sourceHeight = (crop.height / 100) * image.naturalHeight;

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
        (crop.x / 100) * image.naturalWidth,
        (crop.y / 100) * image.naturalHeight,
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
export function PhotoCropModal({
    open,
    imageUrl,
    fileName = "profile-photo.png",
    onOpenChange,
    onCropped,
}: PhotoCropModalProps) {
    const imgRef = useRef<HTMLImageElement | null>(null);
    const [crop, setCrop] = useState<PercentCrop>();
    const previewRef = useRef<HTMLCanvasElement>(null);
    const [loaded, setLoaded] = useState(false);
    const [imageFailed, setImageFailed] = useState(false);
    const [imageAspect, setImageAspect] = useState(1);
    const [isCropping, setIsCropping] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reset before rendering a new image, so a cached image load cannot race a timer.
    const [cropSource, setCropSource] = useState({ open, imageUrl });
    if (cropSource.open !== open || cropSource.imageUrl !== imageUrl) {
        setCropSource({ open, imageUrl });
        if (open) {
            setCrop(undefined);
            setLoaded(false);
            setImageFailed(false);
            setImageAspect(1);
            setError(null);
            setIsCropping(false);
        }
    }

    const onImageLoad = useCallback((event: SyntheticEvent<HTMLImageElement>) => {
        const { naturalWidth, naturalHeight } = event.currentTarget;
        setImageAspect(naturalWidth / naturalHeight);
        setCrop(centerAspectCrop(naturalWidth, naturalHeight, ASPECT));
        setLoaded(true);
    }, []);

    const handleConfirm = useCallback(async () => {
        const image = imgRef.current;
        if (!image || !crop?.width || !crop?.height) {
            setError("Drag the box to choose which part of the photo to keep.");
            return;
        }

        setIsCropping(true);
        setError(null);
        try {
            const file = await getCroppedFile(image, crop, fileName);
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
    }, [crop, fileName, onCropped, onOpenChange]);

    const handleCancel = useCallback(() => {
        onOpenChange(false);
    }, [onOpenChange]);

    useEffect(() => {
        if (!open || !loaded || !crop || !previewRef.current || !imgRef.current) return;
        const image = imgRef.current;
        const canvas = previewRef.current;
        const frame = window.requestAnimationFrame(() => {
            try {
                const context = canvas.getContext("2d");
                if (!context) return;
                context.clearRect(0, 0, canvas.width, canvas.height);
                context.drawImage(
                    image,
                    (crop.x / 100) * image.naturalWidth,
                    (crop.y / 100) * image.naturalHeight,
                    (crop.width / 100) * image.naturalWidth,
                    (crop.height / 100) * image.naturalHeight,
                    0,
                    0,
                    canvas.width,
                    canvas.height,
                );
            } catch {
                // A source can close while its preview frame is queued.
            }
        });
        return () => window.cancelAnimationFrame(frame);
    }, [crop, loaded, open]);

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                if (!isCropping) onOpenChange(next);
            }}
        >
            <DialogPopup className={styles.modal} showCloseButton={false}>
                <AppModalHeader
                    title="Crop your photo"
                    description="Move and resize the circle to frame your photo."
                    closeDisabled={isCropping}
                    descriptionClassName="body-sm text-ink-muted"
                />
                <div className={styles.body}>
                    <div className={styles.stage} aria-busy={!loaded && !imageFailed}>
                        {!loaded && !imageFailed ? (
                            <p role="status" className="body-sm text-ink-muted">
                                Loading photo?
                            </p>
                        ) : null}
                        {imageFailed ? (
                            <p role="alert" className="body-sm text-danger">
                                This photo could not open. Choose another JPG, PNG or WebP image.
                            </p>
                        ) : imageUrl ? (
                            <ReactCrop
                                crop={crop}
                                onChange={(_, percentCrop) => setCrop(percentCrop)}
                                aspect={ASPECT}
                                circularCrop
                                keepSelection
                                disabled={isCropping || !loaded}
                                aria-label="Photo crop area. Use arrow keys to move the selection."
                                className={styles.cropper}
                                style={
                                    {
                                        "--photo-aspect": imageAspect,
                                        visibility: loaded ? "visible" : "hidden",
                                    } as CSSProperties
                                }
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element -- local object URL; cropping requires the original image element */}
                                <img
                                    ref={imgRef}
                                    src={imageUrl}
                                    alt="Photo to crop"
                                    onLoad={onImageLoad}
                                    onError={() => {
                                        setImageFailed(true);
                                        setLoaded(false);
                                    }}
                                    className={styles.image}
                                />
                            </ReactCrop>
                        ) : null}
                    </div>
                    <div className={styles.previewRow}>
                        <div className={styles.preview}>
                            <canvas
                                ref={previewRef}
                                width={128}
                                height={128}
                                role="img"
                                aria-label="Cropped profile photo preview"
                            />
                        </div>
                        <div className="flex-1 min-inline-0">
                            <p className="body-sm font-semibold text-ink">Profile preview</p>
                            <p className="body-xs mbs-1 text-ink-muted">
                                This is how your photo will appear.
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="min-block-11"
                            disabled={!loaded || imageFailed || isCropping}
                            onClick={() => {
                                const image = imgRef.current;
                                if (image)
                                    setCrop(
                                        centerAspectCrop(
                                            image.naturalWidth,
                                            image.naturalHeight,
                                            ASPECT,
                                        ),
                                    );
                                setError(null);
                            }}
                        >
                            <RotateCcw aria-hidden /> Reset
                        </Button>
                    </div>
                    {error ? (
                        <p role="alert" className="body-sm text-danger">
                            {error}
                        </p>
                    ) : null}
                </div>
                <div className={styles.footer}>
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
                        variant="accent"
                        size="md"
                        loading={isCropping}
                        disabled={
                            isCropping || !loaded || imageFailed || !crop?.width || !crop?.height
                        }
                        onClick={() => void handleConfirm()}
                    >
                        <Check aria-hidden /> {isCropping ? "Preparing photo?" : "Use photo"}
                    </Button>
                </div>
            </DialogPopup>
        </Dialog>
    );
}
