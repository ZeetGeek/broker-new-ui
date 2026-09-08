"use client";

import { type FormEvent, type KeyboardEvent, useRef, useState } from "react";
import dynamic from "next/dynamic";

import { Mic, Paperclip, Send, Smile } from "lucide-react";

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

export function ChatComposer({ onSend }: { onSend: (text: string) => void }) {
    const [draft, setDraft] = useState("");
    const [isEmojiOpen, setIsEmojiOpen] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const canSend = draft.trim().length > 0;

    const submit = () => {
        if (!canSend) return;
        onSend(draft.trim());
        setDraft("");
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

    return (
        <form
            onSubmit={handleSubmit}
            className="
              flex items-end gap-2 rounded-card border border-border-warm bg-surface p-2
              transition-[border-color,box-shadow] duration-160
              focus-within:border-brand/40 focus-within:ring-3 focus-within:ring-brand/15
            "
        >
            <Textarea
                ref={inputRef}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
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

                <Tooltip>
                    <TooltipTrigger
                        render={
                            <Button
                                type="button"
                                size="icon-sm"
                                variant="ghost"
                                className="text-ink-muted"
                                aria-label="Attach a file"
                            >
                                <Paperclip aria-hidden strokeWidth={1.75} />
                            </Button>
                        }
                    />
                    <TooltipContent>Attach a photo or document.</TooltipContent>
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
                            >
                                <Mic aria-hidden strokeWidth={1.75} />
                            </Button>
                        }
                    />
                    <TooltipContent>Record a voice note.</TooltipContent>
                </Tooltip>

                <Button
                    type="submit"
                    size="sm"
                    variant="accent"
                    disabled={!canSend}
                    className="ms-1"
                >
                    <Send aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
                    Send
                </Button>
            </div>
        </form>
    );
}
