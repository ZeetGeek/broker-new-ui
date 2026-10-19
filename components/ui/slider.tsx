"use client";

import { Slider as SliderPrimitive } from "@base-ui/react/slider";

import { cn } from "@/lib/utils";

/**
 * Range slider (two thumbs) on Base UI. Pass `value` as `[min, max]`.
 */
function RangeSlider({
    className,
    value,
    thumbLabels = ["Minimum", "Maximum"],
    ...props
}: Omit<SliderPrimitive.Root.Props<readonly number[]>, "value"> & {
    value: readonly [number, number];
    thumbLabels?: readonly [string, string];
}) {
    return (
        <SliderPrimitive.Root
            data-slot="slider"
            value={value}
            className={cn("inline-full", className)}
            {...props}
        >
            <SliderPrimitive.Control
                className="flex items-center py-2 touch-none select-none inline-full"
            >
                <SliderPrimitive.Track className="relative rounded-full bg-border-warm block-1.5 inline-full">
                    <SliderPrimitive.Indicator className="rounded-full bg-brand" />
                    {thumbLabels.map((label, index) => (
                        <SliderPrimitive.Thumb
                            key={label}
                            index={index}
                            aria-label={label}
                            className="
                              rounded-full border-2 border-brand bg-surface shadow-sm outline-none
                              block-5 inline-5
                              transition-[box-shadow] duration-160
                              focus-visible:ring-3 focus-visible:ring-ring/30
                              data-dragging:ring-3 data-dragging:ring-brand/25
                            "
                        />
                    ))}
                </SliderPrimitive.Track>
            </SliderPrimitive.Control>
        </SliderPrimitive.Root>
    );
}

export { RangeSlider };
