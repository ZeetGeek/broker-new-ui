export const TOOLTIP_SIDES = [
    {
        name: "top",
        label: "Top",
        note: "Default. Icon-only actions and truncated labels above the trigger.",
    },
    {
        name: "bottom",
        label: "Bottom",
        note: "Header controls and toolbar icons — keeps the tip clear of the top chrome.",
    },
    {
        name: "inline-start",
        label: "Inline start",
        note: "When the trigger sits on the end edge of a row.",
    },
    {
        name: "inline-end",
        label: "Inline end",
        note: "When the trigger sits on the start edge of a row.",
    },
] as const;

export const TOOLTIP_USES = [
    {
        name: "plain",
        label: "Plain",
        note: "Short explanation of an icon or truncated string. One sentence, no period.",
    },
    {
        name: "with-kbd",
        label: "With shortcut",
        note: "Action name + Kbd keys. Prefer ShortcutTooltip when the shortcut is in the registry.",
    },
] as const;
