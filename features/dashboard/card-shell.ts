/** Shared dashboard card frame — fixed height so the grid rows align. */
export const DASHBOARD_CARD_HEIGHT = "block-[380px]";

const DASHBOARD_CARD_FRAME = `
  flex flex-col overflow-hidden rounded-card border border-border-warm bg-surface
  p-6 shadow-sm
`;

export const DASHBOARD_CARD_SHELL = `
  ${DASHBOARD_CARD_FRAME} ${DASHBOARD_CARD_HEIGHT}
`;

/** Bottom-row cards with denser property lists — height follows content. */
export const DASHBOARD_CARD_SHELL_AUTO = DASHBOARD_CARD_FRAME;

/** Empty dashboard cards — same fixed height as loaded cards so grid rows align. */
export const DASHBOARD_CARD_SHELL_EMPTY = DASHBOARD_CARD_SHELL;
