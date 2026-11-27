"use client";

import { Popover as PopoverPrimitive } from "@base-ui/react/popover";

import { cn } from "@/lib/utils";

/**
 * InfoTip — a tooltip that also works on touch (the "toggletip" pattern).
 *
 * Desktop: opens on hover, same look and timing as `Tooltip`.
 * Phone: opens on tap, closes on tap outside or Escape.
 *
 * Use ONLY where the trigger does nothing else on click — a price, avatar,
 * badge, status label, truncated text. If the trigger is a button, link,
 * chip, or menu that already acts on click, use `Tooltip` instead: a tap
 * there must run the action, not open a hint.
 *
 * Timing mirrors `components/ui/tooltip.tsx` (80ms intent delay, instant
 * close, 8px gap). Motion is `.t-tooltip` in `app/transitions-dev.css`.
 */

/** Intent delay before hover-open — same as `Tooltip` (`--tt-delay`). */
const INFO_TIP_OPEN_DELAY_MS = 80;
/** Hover-out closes immediately — same as `Tooltip`. */
const INFO_TIP_CLOSE_DELAY_MS = 0;
/** Gap from trigger — same as `Tooltip`. */
const INFO_TIP_SIDE_OFFSET_PX = 8;

function InfoTip({ ...props }: PopoverPrimitive.Root.Props) {
    return <PopoverPrimitive.Root data-slot="info-tip" {...props} />;
}

type InfoTipTriggerProps = PopoverPrimitive.Trigger.Props & {
    /**
     * Stop the tap from reaching a clickable parent (card, row). On by
     * default — opening a hint should never also open the card under it.
     */
    stopPropagation?: boolean;
};

function InfoTipTrigger({
    delay = INFO_TIP_OPEN_DELAY_MS,
    closeDelay = INFO_TIP_CLOSE_DELAY_MS,
    openOnHover = true,
    stopPropagation = true,
    onClick,
    ...props
}: InfoTipTriggerProps) {
    return (
        <PopoverPrimitive.Trigger
            data-slot="info-tip-trigger"
            openOnHover={openOnHover}
            delay={delay}
            closeDelay={closeDelay}
            onClick={(event) => {
                if (stopPropagation) event.stopPropagation();
                onClick?.(event);
            }}
            {...props}
        />
    );
}

function InfoTipContent({
    className,
    side = "top",
    sideOffset = INFO_TIP_SIDE_OFFSET_PX,
    align = "center",
    alignOffset = 0,
    positionMethod = "fixed",
    initialFocus = false,
    finalFocus = false,
    children,
    ...props
}: PopoverPrimitive.Popup.Props &
    Pick<
        PopoverPrimitive.Positioner.Props,
        "align" | "alignOffset" | "side" | "sideOffset" | "positionMethod"
    >) {
    return (
        <PopoverPrimitive.Portal>
            <PopoverPrimitive.Positioner
                align={align}
                alignOffset={alignOffset}
                side={side}
                sideOffset={sideOffset}
                positionMethod={positionMethod}
                className="isolate z-50"
            >
                <PopoverPrimitive.Popup
                    data-slot="info-tip-content"
                    initialFocus={initialFocus}
                    finalFocus={finalFocus}
                    className={cn(
                        `
                          t-tooltip body-xs inline-flex items-center gap-1.5 rounded-md border
                          border-border-warm px-3 py-1.5 font-medium shadow-sm outline-hidden
                          inline-fit max-inline-xs
                        `,
                        className,
                    )}
                    {...props}
                >
                    {children}
                </PopoverPrimitive.Popup>
            </PopoverPrimitive.Positioner>
        </PopoverPrimitive.Portal>
    );
}

export { InfoTip, InfoTipContent, InfoTipTrigger };
export type { InfoTipTriggerProps };
