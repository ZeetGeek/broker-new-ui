"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";

import { cn } from "@/lib/utils";

import { AppImage } from "@/components/shared/app-image";
import { ExternalLink, FileText, Pause, Play } from "@/components/shared/icons";

import type { ChatAttachment, ChatMedia } from "@/features/chat/types";

const ChatLightbox = dynamic(() => import("./chat-lightbox"), { ssr: false });

/** Past this many tiles the rest collapse behind a "+N" overlay. */
const MEDIA_TILE_LIMIT = 4;

function FileAttachment({
    name,
    sizeLabel,
    url,
    isOwn,
}: {
    name: string;
    sizeLabel: string;
    url: string;
    isOwn: boolean;
}) {
    const extension = name.includes(".") ? name.split(".").pop() : undefined;
    const fileType = extension && extension.length <= 8 ? extension.toUpperCase() : "File";

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${name} in a new tab`}
            title={name}
            className={cn(
                `
                  group/file flex items-center gap-3 rounded-inner border bg-brand-soft/40 px-4
                  py-3.5 inline-72 max-inline-full min-inline-0
                  hover:border-brand/45 hover:bg-brand-soft/65
                  focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand
                  focus-visible:outline-none
                `,
                isOwn ? "border-brand/20" : "border-border-warm",
            )}
        >
            <FileText
                aria-hidden
                className="shrink-0 text-brand block-7 inline-7"
                strokeWidth={1.5}
            />

            <div className="flex flex-1 flex-col gap-1 min-inline-0">
                <p
                    className={cn(
                        `
                          body-sm line-clamp-2 font-semibold wrap-anywhere text-ink underline
                          decoration-transparent underline-offset-4
                          group-hover/file:decoration-current
                          group-focus-visible/file:decoration-current
                        `,
                    )}
                >
                    {name}
                </p>
                <p className="body-xs font-medium text-ink/65">
                    {fileType}
                    {sizeLabel ? ` · ${sizeLabel}` : ""}
                </p>
            </div>
            <ExternalLink
                aria-hidden
                className="
                  shrink-0 text-ink/45 block-4 inline-4
                  group-hover/file:text-brand
                  group-focus-visible/file:text-brand
                "
                strokeWidth={1.75}
            />
        </a>
    );
}

/**
 * Bar heights for the waveform. Fixed rather than sampled from the audio —
 * decoding a file to draw peaks costs more than the decoration is worth, and
 * a voice note only needs to *look* like one.
 */
const WAVEFORM_BARS = [
    40, 65, 45, 80, 55, 95, 70, 100, 60, 85, 50, 75, 90, 45, 70, 55, 85, 40, 65, 50,
];

function AudioAttachment({ url, durationLabel }: { url: string; durationLabel?: string }) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const toggle = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (audio.paused) {
            void audio.play().catch(() => setIsPlaying(false));
        } else {
            audio.pause();
        }
    };

    return (
        <div className="flex items-center gap-3 pe-1 min-inline-0 sm:min-inline-52">
            <audio
                ref={audioRef}
                src={url || undefined}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
            />

            <button
                type="button"
                onClick={toggle}
                aria-label={isPlaying ? "Pause voice note" : "Play voice note"}
                className="
                  flex shrink-0 items-center justify-center rounded-full bg-brand-ink text-surface
                  transition-colors duration-160 block-control-lg inline-control-lg
                  hover:bg-brand-deep
                  focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none
                "
            >
                {isPlaying ? (
                    <Pause aria-hidden className="block-4 inline-4" strokeWidth={2} />
                ) : (
                    <Play aria-hidden className="block-4 inline-4" strokeWidth={2} />
                )}
            </button>

            <div aria-hidden className="flex flex-1 items-center gap-[3px] block-7 min-inline-12">
                {WAVEFORM_BARS.map((height, index) => (
                    <span
                        key={index}
                        style={{ height: `${height}%` }}
                        className="flex-1 rounded-full bg-brand/35 min-inline-[2px]"
                    />
                ))}
            </div>

            {durationLabel ? (
                <span className="body-xs tabular shrink-0 font-medium text-ink/65">
                    {durationLabel}
                </span>
            ) : null}
        </div>
    );
}

function MediaTile({
    item,
    overlayCount,
    className,
}: {
    item: ChatMedia;
    overlayCount?: number;
    className?: string;
}) {
    const [lightboxOpen, setLightboxOpen] = useState(false);

    if (item.kind === "image") {
        return (
            <>
                <div className={cn("group/tile relative rounded-inner", className)}>
                    <button
                        type="button"
                        onClick={() => setLightboxOpen(true)}
                        aria-label={
                            overlayCount ? `Show ${overlayCount} more photos` : "Open photo"
                        }
                        className="
                          relative block cursor-zoom-in overflow-hidden rounded-inner block-full
                          inline-full
                          focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none
                          focus-visible:ring-inset
                        "
                    >
                        <AppImage
                            src={item.src}
                            alt="Photo attachment"
                            fill
                            sizes="256px"
                            quality={75}
                            unoptimized
                            className="object-cover"
                        />
                        {overlayCount ? (
                            <span
                                className="
                                  absolute inset-0 flex items-center justify-center bg-ink/60
                                  text-lg font-semibold text-surface
                                "
                            >
                                +{overlayCount}
                            </span>
                        ) : null}
                    </button>
                </div>
                {lightboxOpen ? (
                    <ChatLightbox src={item.src} onClose={() => setLightboxOpen(false)} />
                ) : null}
            </>
        );
    }

    return (
        <a
            href={item.src}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
                `
                  group/tile relative block overflow-hidden rounded-inner bg-ink/30
                  focus-visible:ring-2 focus-visible:ring-surface/60 focus-visible:outline-none
                `,
                className,
            )}
            aria-label={
                overlayCount
                    ? `Show ${overlayCount} more`
                    : item.kind === "video"
                      ? "Open video"
                      : "Open photo"
            }
        >
            <AppImage
                src={item.src}
                alt=""
                fill
                sizes="(max-width: 640px) 256px, 256px"
                quality={75}
                unoptimized
                className="
                  object-cover transition-transform duration-160
                  group-hover/tile:scale-[1.03]
                "
            />

            {overlayCount ? (
                <span
                    className="
                      absolute inset-0 flex items-center justify-center bg-ink/60 text-lg
                      font-semibold text-surface
                    "
                >
                    +{overlayCount}
                </span>
            ) : null}

            {!overlayCount && item.kind === "video" ? (
                <>
                    <span
                        className="
                          absolute inset-0 flex items-center justify-center text-surface
                          drop-shadow-md
                        "
                    >
                        <Play aria-hidden className="block-8 inline-8" strokeWidth={1.5} />
                    </span>
                    {item.durationLabel ? (
                        <span
                            className="
                              tabular absolute inset-e-2 inset-be-2 rounded-md bg-ink/70 px-1.5
                              py-0.5 text-[11px] font-semibold text-surface
                            "
                        >
                            {item.durationLabel}
                        </span>
                    ) : null}
                </>
            ) : null}
        </a>
    );
}

function MediaAttachment({ items }: { items: ChatMedia[] }) {
    if (items.length === 1) {
        const item = items[0];
        return (
            <div className="flex flex-col gap-2 max-inline-64 min-inline-0 sm:min-inline-52">
                <MediaTile item={item} className="aspect-4/3 block-48 inline-full max-block-72" />
            </div>
        );
    }

    const visible = items.slice(0, MEDIA_TILE_LIMIT);
    const hidden = items.length - visible.length;

    return (
        <div className="grid grid-cols-2 gap-2 min-inline-0 sm:min-inline-52">
            {visible.map((item, index) => (
                <MediaTile
                    key={item.id}
                    item={item}
                    overlayCount={hidden > 0 && index === MEDIA_TILE_LIMIT - 1 ? hidden : undefined}
                    className="aspect-square inline-full min-block-24"
                />
            ))}
        </div>
    );
}

export function ChatAttachmentBlock({
    attachment,
    isOwn = true,
}: {
    attachment: ChatAttachment;
    isOwn?: boolean;
}) {
    if (attachment.kind === "file") {
        return (
            <FileAttachment
                name={attachment.name}
                sizeLabel={attachment.sizeLabel}
                url={attachment.url}
                isOwn={isOwn}
            />
        );
    }

    if (attachment.kind === "audio") {
        return <AudioAttachment url={attachment.url} durationLabel={attachment.durationLabel} />;
    }

    return <MediaAttachment items={attachment.items} />;
}
