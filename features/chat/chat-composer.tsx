"use client";

import { type ChangeEvent, type FormEvent, type KeyboardEvent, useRef, useState } from "react";
import dynamic from "next/dynamic";

import { Mic, Paperclip, Send, Smile, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * The picker pulls a large emoji dataset. Brokers on cheap Android phones
 * should not pay for it until they tap the face.
 */
const EmojiPicker = dynamic(() => import("emoji-picker-react"), {
    ssr: false,
    loading: () => <div className="block-80 inline-72" aria-hidden />,
});

const ACCEPT = ".pdf,.png,.jpg,.jpeg,.webp,.gif,.txt,.doc,.docx,.xls,.xlsx,application/pdf,image/*";

function formatBytes(size: number): string {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function ChatComposer({
    onSend,
    disabled = false,
    sending = false,
    closed = false,
}: {
    onSend: (text: string, file?: File) => void | Promise<void>;
    disabled?: boolean;
    sending?: boolean;
    closed?: boolean;
}) {
    const [draft, setDraft] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [isEmojiOpen, setIsEmojiOpen] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const canSend = !disabled && !sending && (draft.trim().length > 0 || Boolean(file));

    const submit = () => {
        if (!canSend) return;
        void onSend(draft.trim(), file ?? undefined);
        setDraft("");
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        inputRef.current?.focus();
    };

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        submit();
    };

    // Enter sends, Shift+Enter breaks the line — what every chat app does.
    const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            submit();
        }
    };

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const next = event.target.files?.[0] ?? null;
        if (!next) return;
        if (next.size > 10 * 1024 * 1024) {
            event.target.value = "";
            return;
        }
        setFile(next);
    };

    if (closed) {
        return (
            <p
                className="
              body-sm rounded-card border border-border-warm bg-surface-muted px-4 py-3
              text-ink-muted
            "
            >
                Messaging is closed for this request.
            </p>
        );
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="
              flex flex-col gap-2 rounded-card border border-border-warm bg-surface p-2
              transition-[border-color,box-shadow] duration-160
              focus-within:border-brand/40 focus-within:ring-3 focus-within:ring-brand/15
            "
        >
            {file ? (
                <div className="flex items-center gap-2 rounded-control bg-surface-muted px-3 py-2">
                    <div className="flex-1 min-inline-0">
                        <p className="body-sm truncate font-medium text-ink">{file.name}</p>
                        <p className="body-xs text-ink-muted">{formatBytes(file.size)}</p>
                    </div>
                    <Button
                        type="button"
                        size="icon-xs"
                        variant="ghost"
                        aria-label="Remove attachment"
                        disabled={disabled || sending}
                        onClick={() => {
                            setFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                    >
                        <X aria-hidden strokeWidth={1.75} />
                    </Button>
                </div>
            ) : null}

            <div className="flex items-end gap-2">
                <Textarea
                    ref={inputRef}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    disabled={disabled || sending}
                    placeholder="Type a message…"
                    aria-label="Type a message"
                    className="
                      bg-transparent p-2 max-block-32 min-block-10
                      focus-visible:border-transparent focus-visible:ring-0
                    "
                />

                <div className="flex shrink-0 items-center gap-0.5">
                    <Popover open={isEmojiOpen} onOpenChange={setIsEmojiOpen}>
                        <PopoverTrigger
                            render={
                                <Button
                                    type="button"
                                    size="icon-sm"
                                    variant="ghost"
                                    className="text-ink-muted"
                                    aria-label="Add an emoji"
                                    disabled={disabled || sending}
                                >
                                    <Smile aria-hidden strokeWidth={1.75} />
                                </Button>
                            }
                        />
                        <PopoverContent
                            side="top"
                            align="end"
                            className="border-none bg-transparent p-0 shadow-none inline-auto"
                        >
                            <EmojiPicker
                                lazyLoadEmojis
                                onEmojiClick={(emoji) => {
                                    setDraft((prev) => prev + emoji.emoji);
                                    setIsEmojiOpen(false);
                                    inputRef.current?.focus();
                                }}
                            />
                        </PopoverContent>
                    </Popover>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept={ACCEPT}
                        className="hidden"
                        onChange={handleFileChange}
                    />

                    <Tooltip>
                        <TooltipTrigger
                            render={
                                <Button
                                    type="button"
                                    size="icon-sm"
                                    variant="ghost"
                                    className="text-ink-muted"
                                    aria-label="Attach a file"
                                    disabled={disabled || sending}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Paperclip aria-hidden strokeWidth={1.75} />
                                </Button>
                            }
                        />
                        <TooltipContent>Attach a photo or document (max 10 MB).</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger
                            render={
                                <Button
                                    type="button"
                                    size="icon-sm"
                                    variant="ghost"
                                    className="text-ink-muted"
                                    aria-label="Record a voice note"
                                    disabled
                                >
                                    <Mic aria-hidden strokeWidth={1.75} />
                                </Button>
                            }
                        />
                        <TooltipContent>Voice notes coming soon.</TooltipContent>
                    </Tooltip>

                    <Button
                        type="submit"
                        size="sm"
                        variant="accent"
                        disabled={!canSend}
                        className="ms-1"
                    >
                        <Send aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
                        {sending ? "Sending…" : "Send"}
                    </Button>
                </div>
            </div>
        </form>
    );
}
