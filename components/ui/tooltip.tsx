"use client";

import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";

import { cn } from "@/lib/utils";

/** Intent delay before open — transitions.dev `--tt-delay` / `--duration-micro`. */
const TOOLTIP_OPEN_DELAY_MS = 80;
/** Close starts immediately; out motion is `--tt-out-dur` (50ms) in CSS. */
const TOOLTIP_CLOSE_DELAY_MS = 0;
/** Gap from trigger — transitions.dev recipe uses 8px (`--distance-base`). */
const TOOLTIP_SIDE_OFFSET_PX = 8;

function TooltipProvider({
    delay = TOOLTIP_OPEN_DELAY_MS,
    closeDelay = TOOLTIP_CLOSE_DELAY_MS,
    ...props
}: TooltipPrimitive.Provider.Props) {
    return (
        <TooltipPrimitive.Provider
            data-slot="tooltip-provider"
            delay={delay}
            closeDelay={closeDelay}
            {...props}
        />
    );
}

function Tooltip({ ...props }: TooltipPrimitive.Root.Props) {
    return <TooltipPrimitive.Root data-slot="tooltip" {...props} />;
}

function TooltipTrigger({
    delay = TOOLTIP_OPEN_DELAY_MS,
    closeDelay = TOOLTIP_CLOSE_DELAY_MS,
    ...props
}: TooltipPrimitive.Trigger.Props) {
    return (
        <TooltipPrimitive.Trigger
            data-slot="tooltip-trigger"
            delay={delay}
            closeDelay={closeDelay}
            {...props}
        />
    );
}

function TooltipContent({
    className,
    side = "top",
    sideOffset = TOOLTIP_SIDE_OFFSET_PX,
    align = "center",
    alignOffset = 0,
    children,
    ...props
}: TooltipPrimitive.Popup.Props &
    Pick<
        TooltipPrimitive.Positioner.Props,
        "align" | "alignOffset" | "side" | "sideOffset"
    >) {
    return (
        <TooltipPrimitive.Portal>
            <TooltipPrimitive.Positioner
                align={align}
                alignOffset={alignOffset}
                side={side}
                sideOffset={sideOffset}
                className="isolate z-50"
            >
                <TooltipPrimitive.Popup
                    data-slot="tooltip-content"
                    className={cn(
                        `
                          t-tooltip body-xs z-50 inline-flex w-fit max-w-xs items-center gap-1.5
                          rounded-inner px-3 py-1.5 font-medium shadow-lg
                          has-data-[slot=kbd]:pe-1.5
                          **:data-[slot=kbd]:relative **:data-[slot=kbd]:isolate
                          **:data-[slot=kbd]:z-50 **:data-[slot=kbd]:rounded-lg
                        `,
                        className,
                    )}
                    {...props}
                >
                    {children}
                    <TooltipPrimitive.Arrow
                        className={`
                          t-tooltip-arrow z-50 size-2.5 translate-y-[calc(-50%-2px)] rotate-45
                          rounded-[2px]
                          data-[side=bottom]:top-1
                          data-[side=inline-end]:top-1/2! data-[side=inline-end]:-start-1
                          data-[side=inline-end]:-translate-y-1/2
                          data-[side=inline-end]:translate-x-[1.5px]
                          rtl:data-[side=inline-end]:-translate-x-[1.5px]
                          data-[side=inline-start]:top-1/2! data-[side=inline-start]:-end-1
                          data-[side=inline-start]:-translate-y-1/2
                          data-[side=inline-start]:translate-x-[-1.5px]
                          rtl:data-[side=inline-start]:-translate-x-[-1.5px]
                          data-[side=left]:top-1/2! data-[side=left]:-right-1
                          data-[side=left]:-translate-y-1/2 data-[side=left]:translate-x-[-1.5px]
                          rtl:data-[side=left]:-translate-x-[-1.5px]
                          data-[side=right]:top-1/2! data-[side=right]:-left-1
                          data-[side=right]:-translate-y-1/2 data-[side=right]:translate-x-[1.5px]
                          rtl:data-[side=right]:-translate-x-[1.5px]
                          data-[side=top]:-bottom-2.5
                        `}
                    />
                </TooltipPrimitive.Popup>
            </TooltipPrimitive.Positioner>
        </TooltipPrimitive.Portal>
    );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
