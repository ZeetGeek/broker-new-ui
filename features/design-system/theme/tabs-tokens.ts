export const TABS_VARIANTS = [
    {
        name: "default",
        label: "Pill track",
        note: "Default TabsList. surface-muted track, surface active pill, rounded-control.",
    },
    {
        name: "line",
        label: "Line",
        note: "Underline indicator. Quiet section headers and dense toolbars.",
    },
    {
        name: "sliding",
        label: "Sliding pill",
        note: "transitions-dev .t-tabs — JS measures the active tab; CSS tweens the pill.",
    },
] as const;

export const TABS_USES = [
    {
        name: "sections",
        label: "Section switch",
        note: "Two or three peer views on one screen — full details vs quick add.",
    },
    {
        name: "panels",
        label: "With panels",
        note: "TabsContent holds the view. Keep one panel mounted at a time unless state must survive.",
    },
    {
        name: "counts",
        label: "With counts",
        note: "Tabular count badge. Zero stays quiet — never a bare 0 as the only signal.",
    },
] as const;

export const TABS_ORIENTATIONS = [
    {
        name: "horizontal",
        label: "Horizontal",
        note: "Default. Mobile-first row; scroll when labels overflow.",
    },
    {
        name: "vertical",
        label: "Vertical",
        note: "Desktop settings side-nav. Avoid on phones — use horizontal instead.",
    },
] as const;
