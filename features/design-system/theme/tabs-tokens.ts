export const TABS_VARIANT = {
    name: "surface-pill",
    label: "Surface pill",
    note: "Sliding .t-tabs-surface — surface-muted track, white pill with border + shadow.",
} as const;

export const TABS_USES = [
    {
        name: "sections",
        label: "Section switch",
        note: "Two or three peer views on one screen — full details vs quick add.",
    },
    {
        name: "panels",
        label: "With panels",
        note: "Panel remounts with .t-tabs-panel — soft rise and fade on each switch.",
    },
    {
        name: "counts",
        label: "With counts",
        note: "Stretch bar; pill still slides. Zero stays quiet — never a bare 0 alone.",
    },
] as const;

export const TABS_ORIENTATIONS = [
    {
        name: "horizontal",
        label: "Horizontal",
        note: "Default. Pill tweens translateX + width.",
    },
    {
        name: "vertical",
        label: "Vertical",
        note: "Desktop settings. Pill tweens translateY + height.",
    },
] as const;
