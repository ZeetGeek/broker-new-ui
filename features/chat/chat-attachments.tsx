"use client";

import { useRef, useState } from "react";

import { Download, FileText, Pause, Play } from "lucide-react";

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
const ATTACHMENT_BUTTON_CLASS = `
  border-surface/25 bg-surface/15 text-surface
  hover:bg-surface/25 hover:text-surface
`;

function FileAttachment({
    name,
    sizeLabel,
    url,
}: {
    name: string;
    sizeLabel: string;
    url: string;
}) {
    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
                <span
                    className="
                      flex shrink-0 items-center justify-center rounded-inner bg-surface/15
                      text-surface block-10 inline-10
                    "
                >
                    <FileText aria-hidden className="block-5 inline-5" strokeWidth={1.75} />
                </span>

                <div className="min-inline-0">
                    <p className="body-sm truncate font-semibold text-surface">{name}</p>
                    <p className="body-xs text-surface/70">{sizeLabel}</p>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <Button
                    size="xs"
                    variant="secondary"
                    className={ATTACHMENT_BUTTON_CLASS}
                    render={<a href={url} download aria-label={`Download ${name}`} />}
                >
                    <Download aria-hidden className="block-3.5 inline-3.5" strokeWidth={1.75} />
                    Download
                </Button>
                <Button
                    size="xs"
                    variant="secondary"
                    className={ATTACHMENT_BUTTON_CLASS}
                    render={
                        <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Preview ${name}`}
                        />
                    }
                >
                    Preview
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
        <div className="flex items-center gap-3 pe-1">
            {/* The native <audio> element still does the playing — it is only
                hidden, so its controls do not drop an OS-grey widget into a
                brand-green bubble. */}
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
                  flex shrink-0 items-center justify-center rounded-full bg-surface/20 text-surface
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
    /** When set, the tile shows "+N" instead of its own content. */
    overlayCount?: number;
    className?: string;
}) {
    return (
        <button
            type="button"
            className={cn(
                `
                  group/tile relative overflow-hidden rounded-inner bg-ink/40
                  focus-visible:ring-2 focus-visible:ring-surface/60 focus-visible:outline-none
                `,
                className,
            )}
            aria-label={
                overlayCount
                    ? `Show ${overlayCount} more`
                    : item.kind === "video"
                      ? "Play video"
                      : "Open photo"
            }
        >
            <AppImage
                src={item.src}
                alt=""
                fill
                sizes="(max-width: 640px) 40vw, 10rem"
                className="
                  object-cover transition-transform duration-160
                  group-hover/tile:scale-[1.04]
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
                              tabular absolute inset-e-2 inset-be-2 rounded-full bg-ink/70 px-1.5
                              py-0.5 text-[11px] font-semibold text-surface
                            "
                        >
                            {item.durationLabel}
                        </span>
                    ) : null}
                </>
            ) : null}
        </button>
    );
}

function MediaAttachment({ items }: { items: ChatMedia[] }) {
    // A lone photo or clip gets the full bubble width; a set becomes a grid.
    if (items.length === 1) {
        return (
            <MediaTile
                item={items[0]}
                className="aspect-3/4 block-auto inline-full max-inline-56"
            />
        );
    }

    const visible = items.slice(0, MEDIA_TILE_LIMIT);
    const hidden = items.length - visible.length;

    return (
        <div className="grid grid-cols-2 gap-2">
            {visible.map((item, index) => (
                <MediaTile
                    key={item.id}
                    item={item}
                    overlayCount={hidden > 0 && index === MEDIA_TILE_LIMIT - 1 ? hidden : undefined}
                    className="aspect-square inline-full"
                />
            ))}
        </div>
    );
}

export function ChatAttachmentBlock({ attachment }: { attachment: ChatAttachment }) {
    if (attachment.kind === "file") {
        return (
            <FileAttachment
                name={attachment.name}
                sizeLabel={attachment.sizeLabel}
                url={attachment.url}
            />
        );
    }

    if (attachment.kind === "audio") {
        return <AudioAttachment url={attachment.url} durationLabel={attachment.durationLabel} />;
    }

    return <MediaAttachment items={attachment.items} />;
}
