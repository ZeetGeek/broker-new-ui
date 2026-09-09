"use client";

import { useCallback, useRef, useState } from "react";

import { Camera } from "lucide-react";

import type { UserProfile } from "@/lib/api/profile";
import { profileApi } from "@/lib/api/profile";
import { resolveUserAvatarImageUrl } from "@/lib/auth/avatar";

import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";

/** What the storage bucket accepts. Stated to the user, and enforced here. */
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_SIZE_MB = 5;

type ProfilePhotoFieldProps = {
    profile: UserProfile | null;
    onUploaded: (profile: UserProfile) => void;
};

/**
 * Profile photo, uploaded on pick.
 *
 * No "save" step — a photo is a single decision, and making it wait behind the
 * page's Save button would let a broker pick a picture, leave, and never
 * discover it was not kept.
 *
 * The preview swaps to the chosen file immediately via an object URL, because
 * on a slow connection the upload can take several seconds and a photo that
 * does not visibly change reads as a failed tap.
 */
export function ProfilePhotoField({ profile, onUploaded }: ProfilePhotoFieldProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const name = profile?.fullName?.trim() || profile?.email || "You";
    const savedUrl = resolveUserAvatarImageUrl({
        avatarUrl: profile?.avatarUrl,
        authProvider: profile?.authProvider,
    });

    const handleFile = useCallback(
        async (file: File) => {
            setError(null);

            if (!ACCEPTED_TYPES.includes(file.type)) {
                setError("That file type will not work. Use a PNG, JPG or WEBP.");
                return;
            }
            if (file.size > MAX_SIZE_MB * 1024 * 1024) {
                setError(`That photo is over ${MAX_SIZE_MB}MB. Try a smaller one.`);
                return;
            }

            const localUrl = URL.createObjectURL(file);
            setPreviewUrl(localUrl);
            setIsUploading(true);

            try {
                const updated = await profileApi.uploadAvatar(file);
                onUploaded(updated);
            } catch {
                // Put the old photo back rather than leaving a preview that
                // looks saved and is not.
                setPreviewUrl(null);
                setError("Could not upload that photo. Check your connection and try again.");
            } finally {
                setIsUploading(false);
                URL.revokeObjectURL(localUrl);
            }
        },
        [onUploaded],
    );

    return (
        <section
            className="
              flex flex-col gap-4 rounded-card border border-border-warm bg-surface p-4
              sm:flex-row sm:items-center sm:p-5
            "
            aria-labelledby="profile-photo-heading"
        >
            <UserAvatar
                name={name}
                imageUrl={previewUrl ?? savedUrl}
                size="lg"
                className="shrink-0 block-20 inline-20"
            />

            <div className="flex flex-1 flex-col gap-2 min-inline-0">
                <div className="flex flex-col gap-0.5">
                    <h2 id="profile-photo-heading" className="body font-semibold text-ink">
                        Profile photo
                    </h2>
                    <p className="body-sm text-ink-muted">
                        Owners are deciding whether to trust you with their property. A real photo
                        of your face does more than anything else on this page.
                    </p>
                </div>

                <input
                    ref={inputRef}
                    type="file"
                    accept={ACCEPTED_TYPES.join(",")}
                    className="sr-only"
                    // Cleared after every pick so choosing the same file twice
                    // still fires a change event.
                    onChange={(event) => {
                        const file = event.target.files?.[0];
                        event.target.value = "";
                        if (file) void handleFile(file);
                    }}
                />

                <div className="flex flex-wrap items-center gap-3">
                    <Button
                        variant="secondary"
                        size="sm"
                        loading={isUploading}
                        onClick={() => inputRef.current?.click()}
                    >
                        <Camera aria-hidden />
                        {isUploading ? "Uploading…" : savedUrl ? "Change photo" : "Add a photo"}
                    </Button>
                    <span className="body-xs text-ink-subtle">
                        PNG, JPG or WEBP · up to {MAX_SIZE_MB}MB
                    </span>
                </div>

                {error ? (
                    // Inline and persistent. An upload failure in a toast is a
                    // lost error — docs/MESSAGES.md.
                    <p role="alert" className="body-sm text-danger">
                        {error}
                    </p>
                ) : null}
            </div>
        </section>
    );
}
