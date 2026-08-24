"use client";

import { Emoji, EmojiStyle } from "emoji-picker-react";

const FIRE_UNIFIED = "1f525";

export function StreakFireEmoji() {
    return (
        <span aria-hidden className="inline-flex shrink-0">
            <Emoji unified={FIRE_UNIFIED} size={12} emojiStyle={EmojiStyle.APPLE} />
        </span>
    );
}
