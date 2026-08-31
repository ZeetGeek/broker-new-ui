import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const kbdVariants = cva(
    `
      pointer-events-none inline-flex select-none items-center justify-center gap-1.5
      rounded-sm border text-xs tracking-tight text-nowrap font-sans font-medium
      text-ink dark:text-foreground
      border-border-warm/50 dark:border-border/20
      [box-shadow:hsl(218,13%,50%,0.1)_0_-2px_0_0_inset]
      dark:[box-shadow:hsl(218,13%,70%,0.08)_0_-2px_0_0_inset]
      hover:[box-shadow:none] dark:hover:[box-shadow:none]
      px-2 py-0.5
      in-data-[slot=input-group]:bg-input
      in-data-[slot=tooltip-content]:bg-canvas/15
      in-data-[slot=tooltip-content]:text-canvas
      [&_svg:not([class*='size-'])]:block-3 [&_svg:not([class*='size-'])]:inline-3
    `,
    {
        variants: {
            variant: {
                surface: "bg-surface hover:bg-surface",
                muted: "bg-surface-muted hover:bg-surface-muted",
            },
        },
        defaultVariants: {
            variant: "muted",
        },
    },
);

function Kbd({
    className,
    variant,
    ...props
}: React.ComponentProps<"kbd"> & VariantProps<typeof kbdVariants>) {
    return (
        <kbd
            data-slot="kbd"
            className={cn(kbdVariants({ variant }), className)}
            {...props}
        />
    );
}

function KbdGroup({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="kbd-group"
            className={cn("inline-flex items-center gap-1.5", className)}
            {...props}
        />
    );
}

export { Kbd, KbdGroup, kbdVariants };
