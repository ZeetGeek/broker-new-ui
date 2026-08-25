/** Shared dashboard card frame — fixed height so the grid rows align. */
export const DASHBOARD_CARD_HEIGHT = "block-[360px]";

export const DASHBOARD_CARD_SHELL = `
  flex flex-col overflow-hidden rounded-card border border-border-warm bg-surface
  p-8 shadow-sm ${DASHBOARD_CARD_HEIGHT}
`;
