"use client";

import { type DragEvent,useId, useRef, useState } from "react";

import { ImageUp } from "lucide-react";

import { cn } from "@/lib/utils";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export type PhotoRejection = { fileName: string; reason: string };

/**
 * Full-width drop target for listing photos. Handles click-to-browse, drag and
 * drop, and per-file type/size checks; the caller decides what to do with the
 * accepted files.
 */
export function PhotoDropzone({
    onFiles,
    onReject,
    remaining,
    maxSizeMb,
    disabled,
    className,
}: {
    /** Called with the files that passed type, size, and remaining-slot checks. */
    onFiles: (files: File[]) => void;
    /** Called with the files that were turned away, and why. */
    onReject?: (rejections: PhotoRejection[]) => void;
    /** Photo slots still free — files beyond this are rejected. */
    remaining: number;
    maxSizeMb: number;
    disabled?: boolean;
    className?: string;
}) {
    const inputId = useId();
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const isFull = remaining <= 0;
    const isDisabled = disabled || isFull;

    function handleFiles(fileList: FileList | null) {
        if (!fileList || isDisabled) return;

        const accepted: File[] = [];
        const rejected: PhotoRejection[] = [];

        for (const file of Array.from(fileList)) {
            if (!ACCEPTED_TYPES.includes(file.type)) {
                rejected.push({ fileName: file.name, reason: "not a JPG, PNG, or WebP" });
                continue;
            }
            if (file.size > maxSizeMb * 1024 * 1024) {
                rejected.push({ fileName: file.name, reason: `larger than ${maxSizeMb} MB` });
                continue;
            }
            if (accepted.length >= remaining) {
                rejected.push({ fileName: file.name, reason: "no photo slots left" });
                continue;
            }
            accepted.push(file);
        }

        if (accepted.length > 0) onFiles(accepted);
        if (rejected.length > 0) onReject?.(rejected);
    }

    function handleDrop(event: DragEvent<HTMLDivElement>) {
        event.preventDefault();
        setIsDragging(false);
        handleFiles(event.dataTransfer.files);
    }

    return (
        <div
            onDragOver={(event) => {
                event.preventDefault();
                if (!isDisabled) setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={cn(
                `
                  flex flex-col items-center justify-center gap-2 rounded-card border-2
                  border-dashed border-border-warm bg-surface px-6 py-8 text-center
                  transition-colors duration-160 inline-full
                `,
                isDragging && "border-brand bg-brand-soft",
                isDisabled && "opacity-60",
                className,
            )}
        >
            <input
                ref={inputRef}
                id={inputId}
                type="file"
                accept={ACCEPTED_TYPES.join(",")}
                multiple
                disabled={isDisabled}
                className="sr-only"
                onChange={(event) => {
                    handleFiles(event.target.files);
                    // Let the same file be picked again after a removal.
                    event.target.value = "";
                }}
            />

            <ImageUp
                aria-hidden
                className={cn(
                    "block-8 inline-8",
                    isDragging ? "text-brand-text" : "text-ink-muted",
                )}
                strokeWidth={1.5}
            />

            {isFull ? (
                <p className="body-sm font-semibold text-ink">
                    All photo slots are full — remove one to add another
                </p>
            ) : (
                <>
                    <p className="body-sm font-semibold text-ink">
                        Drag photos here, or{" "}
                        <button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            disabled={isDisabled}
                            className="
                              rounded-sm text-brand underline underline-offset-4
                              hover:text-brand-text
                              focus-visible:ring-2 focus-visible:ring-brand
                              focus-visible:outline-none
                            "
                        >
                            browse your device
                        </button>
                    </p>
                    <p className="body-xs text-ink-muted">
                        JPG, PNG, or WebP · up to {maxSizeMb} MB each · {remaining}{" "}
                        {remaining === 1 ? "slot" : "slots"} left
                    </p>
                </>
            )}
        </div>
    );
}
