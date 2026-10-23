"use client";

import { type ChangeEvent, type FormEvent, type KeyboardEvent, useRef, useState } from "react";
import toast from "react-hot-toast";
import dynamic from "next/dynamic";

import { cn } from "@/lib/utils";

import { FileText, ImagePlus, Plus, Smile, X } from "@/components/shared/icons";
import { Skeleton } from "@/components/shared/skeleton";
import {
    Attachment,
    AttachmentActions,
    AttachmentContent,
    AttachmentDescription,
    AttachmentMedia,
    AttachmentTitle,
} from "@/components/ui/attachment";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Popover,
    PopoverContent,
    PopoverHeader,
    PopoverTitle,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";

import styles from "./chat-emoji-picker.module.css";

/**
 * The picker pulls a large emoji dataset. Brokers on cheap Android phones
 * should not pay for it until they tap the face.
 */
const EmojiPicker = dynamic(() => import("emoji-picker-react"), {
    ssr: false,
    loading: () => (
        <div role="status" className="space-y-4 p-4 block-80">
            <span className="sr-only">Loading emojis…</span>
            <Skeleton className="block-10 inline-full motion-reduce:animate-none" />
            <Skeleton className="block-8 inline-full motion-reduce:animate-none" />
            <Skeleton className="block-40 inline-full motion-reduce:animate-none" />
        </div>
    ),
});

const ACCEPT = ".pdf,.png,.jpg,.jpeg,.webp,.gif,.txt,.doc,.docx,.xls,.xlsx,application/pdf,image/*";

const TOOL_BUTTON_CLASS = `
  text-ink/65
  hover:bg-ink/5 hover:text-ink
  aria-expanded:bg-ink/5 aria-expanded:text-ink
  focus-visible:border-ink/25 focus-visible:ring-ink/10
  sm:block-control-md sm:inline-control-md
`;

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
    recipientName,
}: {
    onSend: (text: string, file?: File) => boolean | Promise<boolean>;
    disabled?: boolean;
    sending?: boolean;
    closed?: boolean;
    recipientName?: string;
}) {
    const [draft, setDraft] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [isEmojiOpen, setIsEmojiOpen] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const canSend = !disabled && !sending && (draft.trim().length > 0 || Boolean(file));

    const submit = async () => {
        if (!canSend) return;
        const sent = await onSend(draft.trim(), file ?? undefined);
        if (!sent) return;
        setDraft("");
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        inputRef.current?.focus();
    };

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        void submit();
    };

    // Enter sends, Shift+Enter breaks the line — what every chat app does.
    const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault();
            void submit();
        }
    };

    const chooseFile = (accept = ACCEPT) => {
        const input = fileInputRef.current;
        if (!input) return;
        input.accept = accept;
        input.click();
    };

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const next = event.target.files?.[0] ?? null;
        if (!next) return;
        if (next.size > 10 * 1024 * 1024) {
            toast.error("Choose a file smaller than 10 MB.");
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
                  font-medium text-ink/65
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
              flex flex-col gap-1 overflow-hidden rounded-card border border-transparent
              bg-surface-muted p-3 transition-[border-color,box-shadow] duration-160
              focus-within:border-ink/25 focus-within:ring-3 focus-within:ring-ink/5
            "
        >
            {file ? (
                <Attachment
                    state={sending ? "uploading" : "done"}
                    style={{ inlineSize: "100%", minInlineSize: 0 }}
                    className="
                      mbe-2 flex-nowrap rounded-inner shadow-none
                      focus-within:border-ink/25 focus-within:ring-ink/5
                    "
                >
                    <AttachmentMedia className="bg-surface-muted text-ink/65">
                        <FileText aria-hidden strokeWidth={1.75} />
                    </AttachmentMedia>
                    <AttachmentContent>
                        <AttachmentTitle title={file.name} className="text-sm font-medium">
                            {file.name}
                        </AttachmentTitle>
                        <AttachmentDescription className="font-medium text-ink/65">
                            {formatBytes(file.size)}
                            {sending ? " · Sending…" : " · Ready to send"}
                        </AttachmentDescription>
                    </AttachmentContent>
                    <AttachmentActions>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            className="
                              rounded-full text-ink/60
                              hover:bg-surface-muted hover:text-ink
                            "
                            aria-label={`Remove ${file.name}`}
                            disabled={disabled || sending}
                            onClick={() => {
                                setFile(null);
                                if (fileInputRef.current) fileInputRef.current.value = "";
                                inputRef.current?.focus();
                            }}
                        >
                            <X aria-hidden strokeWidth={1.75} />
                        </Button>
                    </AttachmentActions>
                </Attachment>
            ) : null}

            <Textarea
                ref={inputRef}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={disabled || sending}
                placeholder={recipientName ? `Message to ${recipientName}` : "Type a message…"}
                aria-label="Type a message"
                className="
                  rounded-none border-0 bg-transparent px-1 py-2 text-base font-medium text-ink
                  caret-brand shadow-none max-block-32 min-block-10
                  placeholder:font-medium placeholder:text-ink/60
                  focus-visible:border-transparent focus-visible:ring-0
                "
            />

            <div className="flex items-center gap-1">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPT}
                    className="hidden"
                    onChange={handleFileChange}
                />

                <DropdownMenu>
                    <DropdownMenuTrigger
                        render={
                            <Button
                                type="button"
                                variant="outline"
                                size="icon-md"
                                className={cn(
                                    TOOL_BUTTON_CLASS,
                                    "rounded-full border-border-warm bg-surface shadow-sm",
                                )}
                                aria-label="Add an attachment"
                                disabled={disabled || sending}
                            />
                        }
                    >
                        <Plus aria-hidden strokeWidth={1.75} />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="top" align="start">
                        <DropdownMenuItem onClick={() => chooseFile("image/*")}>
                            <ImagePlus aria-hidden strokeWidth={1.75} />
                            Add a photo
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => chooseFile()}>
                            <FileText aria-hidden strokeWidth={1.75} />
                            Add a file
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <Popover open={isEmojiOpen} onOpenChange={setIsEmojiOpen}>
                    <PopoverTrigger
                        render={
                            <Button
                                type="button"
                                size="icon-md"
                                variant="ghost"
                                className={TOOL_BUTTON_CLASS}
                                aria-label="Add an emoji"
                                disabled={disabled || sending}
                            >
                                <Smile aria-hidden strokeWidth={1.75} />
                            </Button>
                        }
                    />
                    <PopoverContent
                        side="top"
                        align="start"
                        sideOffset={12}
                        className={cn(
                            styles.popover,
                            "gap-0 overflow-hidden bg-surface p-0 text-ink ring-1 ring-ink/10",
                        )}
                    >
                        <PopoverHeader
                            className={cn(
                                `
                                  shrink-0 flex-row items-center justify-between gap-3 border-be
                                  border-border-warm/60 px-4 py-3
                                `,
                            )}
                        >
                            <PopoverTitle className="font-semibold text-ink">
                                Choose an emoji
                            </PopoverTitle>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-xs"
                                className="
                                  text-ink/60
                                  hover:bg-ink/5 hover:text-ink
                                  focus-visible:border-ink/25 focus-visible:ring-ink/10
                                "
                                aria-label="Close emoji picker"
                                onClick={() => setIsEmojiOpen(false)}
                            >
                                <X aria-hidden strokeWidth={1.75} />
                            </Button>
                        </PopoverHeader>
                        <EmojiPicker
                            className={styles.picker}
                            width="100%"
                            height="min(340px, calc(100dvh - 12rem))"
                            searchPlaceholder="Search emojis…"
                            previewConfig={{ showPreview: false }}
                            autoFocusSearch={false}
                            lazyLoadEmojis
                            onEmojiClick={(emoji) => {
                                setDraft((prev) => prev + emoji.emoji);
                                setIsEmojiOpen(false);
                                inputRef.current?.focus();
                            }}
                        />
                    </PopoverContent>
                </Popover>

                <div
                    data-empty={!draft.trim() && !file}
                    className="ms-auto flex shrink-0 data-[empty=true]:opacity-60"
                >
                    <Button
                        type="submit"
                        size="md"
                        variant="accent"
                        disabled={!canSend}
                        className="px-4 disabled:opacity-100 sm:block-control-md"
                        loading={sending}
                    >
                        {sending ? "Sending…" : "Send now"}
                    </Button>
                </div>
            </div>
        </form>
    );
}
