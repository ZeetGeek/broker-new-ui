"use client";

import { useRef, useState } from "react";

import { Download, ExternalLink, FileText, Pause, Play } from "lucide-react";

import { cn } from "@/lib/utils";

import { AppImage } from "@/components/shared/app-image";
import { Button } from "@/components/ui/button";

import type { ChatAttachment, ChatMedia } from "@/features/chat/types";

/** Past this many tiles the rest collapse behind a "+N" overlay. */
const MEDIA_TILE_LIMIT = 4;

/**
 * Actions sitting inside a brand-green bubble. Translucent white keeps them
 * legible without introducing a second green into the palette.
 */
const ATTACHMENT_BUTTON_OWN = `
  border-surface/25 bg-surface/15 text-surface
  hover:bg-surface/25 hover:text-surface
`;

const ATTACHMENT_BUTTON_PEER = `
  border-border-warm bg-surface-muted text-ink
  hover:bg-surface hover:text-ink
`;

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
    const buttonClass = isOwn ? ATTACHMENT_BUTTON_OWN : ATTACHMENT_BUTTON_PEER;
    const iconWrap = isOwn ? "bg-surface/15 text-surface" : "bg-brand-soft text-brand";
    const titleClass = isOwn ? "text-surface" : "text-ink";
    const metaClass = isOwn ? "text-surface/70" : "text-ink-muted";

    return (
        <div className="flex flex-col gap-3 min-inline-52">
            <div className="flex items-center gap-3">
                <span
                    className={cn(
                        `flex shrink-0 items-center justify-center rounded-inner block-10 inline-10`,
                        iconWrap,
                    )}
                >
                    <FileText aria-hidden className="block-5 inline-5" strokeWidth={1.75} />
                </span>

                <div className="min-inline-0">
                    <p className={cn("body-sm truncate font-semibold", titleClass)}>{name}</p>
                    {sizeLabel ? <p className={cn("body-xs", metaClass)}>{sizeLabel}</p> : null}
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <Button
                    size="xs"
                    variant="secondary"
                    className={buttonClass}
                    render={<a href={url} download aria-label={`Download ${name}`} />}
                >
                    <Download aria-hidden className="block-3.5 inline-3.5" strokeWidth={1.75} />
                    Download
                </Button>
                <Button
                    size="xs"
                    variant="secondary"
                    className={buttonClass}
                    render={
                        <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Open ${name}`}
                        />
                    }
                >
                    <ExternalLink aria-hidden className="block-3.5 inline-3.5" strokeWidth={1.75} />
                    Open
                </Button>
            </div>
        </div>
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
        <div className="flex items-center gap-3 pe-1 min-inline-52">
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
                  flex shrink-0 items-center justify-center rounded-control bg-surface/20 text-surface
                  transition-colors duration-160 block-9 inline-9
                  hover:bg-surface/30
                  focus-visible:ring-2 focus-visible:ring-surface/60 focus-visible:outline-none
                "
            >
                {isPlaying ? (
                    <Pause aria-hidden className="block-4 inline-4" strokeWidth={2} />
                ) : (
                    <Play aria-hidden className="block-4 inline-4" strokeWidth={2} />
                )}
            </button>

            <div aria-hidden className="flex flex-1 items-center gap-[3px] block-7 min-inline-32">
                {WAVEFORM_BARS.map((height, index) => (
                    <span
                        key={index}
                        style={{ height: `${height}%` }}
                        className="flex-1 rounded-full bg-surface/45 min-inline-[2px]"
                    />
                ))}
            </div>

            {durationLabel ? (
                <span className="body-xs tabular shrink-0 text-surface/70">{durationLabel}</span>
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

function MediaAttachment({ items, isOwn }: { items: ChatMedia[]; isOwn: boolean }) {
    if (items.length === 1) {
        const item = items[0];
        return (
            <div className="flex flex-col gap-2 max-inline-64 min-inline-52">
                <MediaTile item={item} className="aspect-4/3 block-48 inline-full max-block-72" />
                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        size="xs"
                        variant="secondary"
                        className={isOwn ? ATTACHMENT_BUTTON_OWN : ATTACHMENT_BUTTON_PEER}
                        render={
                            <a
                                href={item.src}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Open attachment"
                            />
                        }
                    >
                        <ExternalLink
                            aria-hidden
                            className="block-3.5 inline-3.5"
                            strokeWidth={1.75}
                        />
                        Open
                    </Button>
                    <Button
                        size="xs"
                        variant="secondary"
                        className={isOwn ? ATTACHMENT_BUTTON_OWN : ATTACHMENT_BUTTON_PEER}
                        render={<a href={item.src} download aria-label="Download attachment" />}
                    >
                        <Download aria-hidden className="block-3.5 inline-3.5" strokeWidth={1.75} />
                        Download
                    </Button>
                </div>
            </div>
        );
    }

    const visible = items.slice(0, MEDIA_TILE_LIMIT);
    const hidden = items.length - visible.length;

    return (
        <div className="grid grid-cols-2 gap-2 min-inline-52">
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

    return <MediaAttachment items={attachment.items} isOwn={isOwn} />;
}
