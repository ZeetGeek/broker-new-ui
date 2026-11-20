"use client";

import { useEffect, useId, useRef, useState } from "react";

import { IconButton } from "@/components/shared/icon-button";
import { Trash2 } from "@/components/shared/icons";
import { PhotoCropModal } from "@/components/shared/photo-crop-modal";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";

/** Local photo selection only; uploading belongs to the contact API integration. */
export function ContactPhotoField({
    name,
    file,
    onChange,
    disabled = false,
}: {
    name: string;
    file: File | null;
    onChange: (file: File | null) => void;
    disabled?: boolean;
}) {
    const id = useId();
    const input = useRef<HTMLInputElement>(null);
    const [error, setError] = useState("");
    const [source, setSource] = useState<{ url: string; name: string } | null>(null);
    const [photoPreview, setPhotoPreview] = useState<{ file: File; url: string } | null>(null);
    const preview = photoPreview?.file === file ? photoPreview?.url : undefined;
    useEffect(() => {
        if (!file) return;
        const url = URL.createObjectURL(file);
        const timer = window.setTimeout(() => setPhotoPreview({ file, url }), 0);
        return () => {
            window.clearTimeout(timer);
            URL.revokeObjectURL(url);
        };
    }, [file]);
    useEffect(
        () => () => {
            if (source) URL.revokeObjectURL(source.url);
        },
        [source],
    );

    return (
        <div className="mbe-6 rounded-inner border border-border-warm p-4">
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => input.current?.click()}
                    aria-label={file ? "Change profile photo" : "Add profile photo"}
                    aria-describedby={`${id}-hint`}
                    className="group relative shrink-0 rounded-full outline-none block-14 inline-14 focus-visible:ring-3 focus-visible:ring-ring/30 disabled:opacity-60"
                >
                    <UserAvatar
                        name={name.trim() || "New contact"}
                        previewUrl={preview}
                        size="lg"
                    />
                </button>
                <div className="flex flex-1 flex-wrap items-center justify-between gap-3 min-inline-0 sm:flex-nowrap">
                    <div className="flex flex-1 flex-col gap-1.5 min-inline-0">
                        <p className="body-sm font-semibold text-ink">
                            Profile photo{" "}
                            <span className="font-normal text-ink-muted">(optional)</span>
                        </p>
                        <p id={`${id}-hint`} className="body-xs text-ink-muted">
                            JPG, PNG or WebP · up to 5 MB
                        </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={disabled}
                            onClick={() => input.current?.click()}
                        >
                            {file ? "Change photo" : "Add photo"}
                        </Button>
                        {file ? (
                            <IconButton
                                type="button"
                                size="sm"
                                aria-label="Remove photo"
                                title="Remove photo"
                                tone="danger"
                                disabled={disabled}
                                onClick={() => {
                                    onChange(null);
                                    setError("");
                                }}
                            >
                                <Trash2 aria-hidden />
                            </IconButton>
                        ) : null}
                    </div>
                </div>
            </div>
            <input
                ref={input}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                aria-label="Choose profile photo"
                className="hidden"
                disabled={disabled}
                onChange={(event) => {
                    const picked = event.target.files?.[0];
                    event.target.value = "";
                    if (!picked) return;
                    if (!["image/jpeg", "image/png", "image/webp"].includes(picked.type)) {
                        setError("Choose a JPG, PNG or WebP photo.");
                        return;
                    }
                    if (picked.size > 5 * 1024 * 1024) {
                        setError("Choose a photo smaller than 5 MB.");
                        return;
                    }
                    setError("");
                    setSource({ url: URL.createObjectURL(picked), name: picked.name });
                }}
            />
            {error ? (
                <p role="alert" className="body-sm mbs-2 text-danger">
                    {error}
                </p>
            ) : null}
            <PhotoCropModal
                open={source !== null}
                imageUrl={source?.url ?? null}
                fileName={source?.name}
                onOpenChange={(open) => {
                    if (!open) setSource(null);
                }}
                onCropped={(cropped) => {
                    onChange(cropped);
                    setSource(null);
                }}
            />
        </div>
    );
}
