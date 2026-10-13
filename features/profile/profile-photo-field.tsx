"use client";

import { useCallback, useRef, useState } from "react";

import { Camera, CropIcon, ImagePlus } from "lucide-react";

import type { UserProfile } from "@/lib/api/profile";
import { profileApi } from "@/lib/api/profile";
import { resolveUserAvatarImageUrl } from "@/lib/auth/avatar";
import { cn } from "@/lib/utils";

import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";

import { ProfileImageCropper } from "@/features/profile/profile-image-cropper";

/** What the storage bucket accepts. Stated to the user, and enforced here. */
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_SIZE_MB = 5;

type ProfilePhotoFieldProps = {
    profile: UserProfile | null;
    /** Owner and broker portals need different trust copy on the same control. */
    isOwner: boolean;
    onUploaded: (profile: UserProfile) => void;
};

/**
 * Profile photo — pick a new image or re-crop the one already saved.
 *
 * Both paths open `ProfileImageCropper`, then upload the square PNG.
 */
export function ProfilePhotoField({ profile, isOwner, onUploaded }: ProfilePhotoFieldProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isPreparingEdit, setIsPreparingEdit] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [cropOpen, setCropOpen] = useState(false);
    const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null);
    const [pendingFileName, setPendingFileName] = useState("profile-photo.png");
    /** Only revoke blob: URLs we created — never remote CDN URLs. */
    const pendingIsObjectUrlRef = useRef(false);

    const name = profile?.fullName?.trim() || profile?.email || "You";
    const savedUrl = resolveUserAvatarImageUrl({
        avatarUrl: profile?.avatarUrl,
        authProvider: profile?.authProvider,
    });
    const hasPhoto = Boolean(savedUrl);
    const busy = isUploading || isPreparingEdit;

    const clearPendingPreview = useCallback(() => {
        setPendingPreviewUrl((prev) => {
            if (prev && pendingIsObjectUrlRef.current) URL.revokeObjectURL(prev);
            pendingIsObjectUrlRef.current = false;
            return null;
        });
    }, []);

    const openCropper = useCallback(
        (previewUrl: string, fileName: string, isObjectUrl: boolean) => {
            clearPendingPreview();
            pendingIsObjectUrlRef.current = isObjectUrl;
            setPendingFileName(fileName);
            setPendingPreviewUrl(previewUrl);
            setCropOpen(true);
        },
        [clearPendingPreview],
    );

    const handlePick = useCallback(
        (file: File) => {
            setError(null);

            if (!ACCEPTED_TYPES.includes(file.type)) {
                setError("That file type will not work. Use a PNG, JPG or WEBP.");
                return;
            }
            if (file.size > MAX_SIZE_MB * 1024 * 1024) {
                setError(`That photo is over ${MAX_SIZE_MB}MB. Try a smaller one.`);
                return;
            }

            openCropper(URL.createObjectURL(file), file.name || "profile-photo.png", true);
        },
        [openCropper],
    );

    /**
     * Re-crop the saved avatar. Fetched to a blob first so the crop canvas is
     * not tainted by a cross-origin CDN image.
     */
    const handleEditExisting = useCallback(async () => {
        if (!savedUrl) return;

        setError(null);
        setIsPreparingEdit(true);
        try {
            const response = await fetch(savedUrl);
            if (!response.ok) {
                throw new Error("Could not open that photo for editing.");
            }
            const blob = await response.blob();
            if (!blob.type.startsWith("image/")) {
                throw new Error("Could not open that photo for editing.");
            }
            openCropper(URL.createObjectURL(blob), "profile-photo.png", true);
        } catch {
            setError("Could not open that photo for editing. Try choosing a new one.");
        } finally {
            setIsPreparingEdit(false);
        }
    }, [openCropper, savedUrl]);

    const handleCropOpenChange = useCallback(
        (open: boolean) => {
            setCropOpen(open);
            if (!open) clearPendingPreview();
        },
        [clearPendingPreview],
    );

    const handleCropped = useCallback(
        async (file: File) => {
            clearPendingPreview();
            setIsUploading(true);
            setError(null);

            try {
                const updated = await profileApi.uploadAvatar(file);
                onUploaded(updated);
            } catch {
                setError("Could not upload that photo. Check your connection and try again.");
            } finally {
                setIsUploading(false);
            }
        },
        [clearPendingPreview, onUploaded],
    );

    return (
        <section
            className="border-be border-border-warm/80 pbe-8"
            aria-labelledby="profile-photo-heading"
        >
            <div
                className={cn(
                    `
                      flex flex-col gap-4 rounded-card border-2 border-dashed border-brand/35
                      bg-brand-soft/40 p-4
                      sm:flex-row sm:items-center sm:gap-5 sm:p-5 sm:px-6
                    `,
                    busy && "opacity-80",
                )}
            >
                {hasPhoto ? (
                    <UserAvatar
                        name={name}
                        imageUrl={savedUrl}
                        size="lg"
                        className="
                          shrink-0 shadow-xs ring-2 ring-brand/25 ring-offset-2
                          ring-offset-brand-soft/40 block-20 inline-20
                        "
                    />
                ) : (
                    <span
                        className="
                          flex shrink-0 items-center justify-center rounded-full border-2
                          border-dashed border-brand/35 bg-brand-soft/40 text-brand block-20
                          inline-20
                        "
                        aria-hidden
                    >
                        <ImagePlus className="block-7 inline-7" strokeWidth={1.75} />
                    </span>
                )}

                <div className="flex flex-1 flex-col gap-2 min-inline-0">
                    <div>
                        <h2
                            id="profile-photo-heading"
                            className="
                              flex items-center gap-2.5 font-display text-xl font-semibold
                              tracking-[-0.02em] text-ink
                            "
                        >
                            <Camera
                                className="shrink-0 text-brand block-5 inline-5"
                                strokeWidth={1.75}
                                aria-hidden
                            />
                            Profile photo
                        </h2>
                        <p className="mbs-1.5 text-sm/6 text-ink-muted max-inline-2xl">
                            {isOwner
                                ? "Brokers see this on your listings. A clear photo of you builds trust faster than any field below."
                                : "Owners are deciding whether to trust you with their property. A real photo of your face does more than anything else on this page."}
                        </p>
                    </div>

                    <input
                        ref={inputRef}
                        type="file"
                        accept={ACCEPTED_TYPES.join(",")}
                        className="sr-only"
                        disabled={busy}
                        onChange={(event) => {
                            const file = event.target.files?.[0];
                            event.target.value = "";
                            if (file) handlePick(file);
                        }}
                    />

                    <div className="flex flex-wrap items-center gap-3">
                        <Button
                            variant="surface"
                            size="sm"
                            loading={isUploading}
                            disabled={busy}
                            onClick={() => inputRef.current?.click()}
                        >
                            <Camera aria-hidden />
                            {isUploading ? "Uploading…" : hasPhoto ? "Change photo" : "Add a photo"}
                        </Button>

                        {hasPhoto ? (
                            <Button
                                variant="outline"
                                size="sm"
                                loading={isPreparingEdit}
                                disabled={busy}
                                onClick={() => void handleEditExisting()}
                            >
                                <CropIcon aria-hidden />
                                {isPreparingEdit ? "Opening…" : "Edit photo"}
                            </Button>
                        ) : null}

                        <span className="body-xs text-ink-subtle">
                            PNG, JPG or WEBP · up to {MAX_SIZE_MB}MB
                        </span>
                    </div>

                    {error ? (
                        <p role="alert" className="body-sm text-danger">
                            {error}
                        </p>
                    ) : null}
                </div>
            </div>

            <ProfileImageCropper
                open={cropOpen}
                imageUrl={pendingPreviewUrl}
                fileName={pendingFileName}
                onOpenChange={handleCropOpenChange}
                onCropped={(file) => void handleCropped(file)}
            />
        </section>
    );
}
