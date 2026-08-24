export const spring = {
    snappy: { type: "spring", stiffness: 500, damping: 30 },
    gentle: { type: "spring", stiffness: 260, damping: 26 },
    bouncy: { type: "spring", stiffness: 400, damping: 17 },
} as const;

export const duration = {
    instant: 0.1,
    fast: 0.16,
    base: 0.22,
    /** Tabs / nav underline slide — matches transitions-dev `--tabs-dur` */
    tabs: 0.25,
    slow: 0.32,
} as const;

export const ease = {
    out: [0.16, 1, 0.3, 1],
    in: [0.7, 0, 0.84, 0],
    inOut: [0.65, 0, 0.35, 1],
    /** Surface moves — matches transitions-dev `--tabs-ease` / smooth-out */
    smoothOut: [0.22, 1, 0.36, 1],
} as const;
