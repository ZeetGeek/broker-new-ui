/**
 * One control height for every field in the property form — text inputs,
 * selects, and the date picker. `control-lg` is 44px, keeping the form compact
 * while preserving the mobile tap-target minimum.
 */
export const FORM_CONTROL_CLASS = "block-control-lg";

/** Shared surface styling for controls that are not the themed `Input`. */
export const FORM_CONTROL_SURFACE_CLASS = `
  rounded-control border-2 border-border-warm bg-surface px-3.5 text-sm text-ink
  hover:border-ink-subtle
  focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30
  aria-invalid:border-danger-mid
`;
