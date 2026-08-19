import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
    `
      inline-flex shrink-0 items-center gap-1 rounded-control border border-transparent px-2.5 py-1
      text-[12px] font-medium whitespace-nowrap
      [&_svg]:pointer-events-none [&_svg]:shrink-0
      [&_svg:not([class*='size-'])]:block-3 [&_svg:not([class*='size-'])]:inline-3
    `,
    {
        variants: {
            variant: {
                brand: "bg-brand-soft text-brand-text",
                urgent: "bg-urgent-soft text-urgent",
                danger: "bg-danger-soft text-danger",
                neutral: "bg-surface-muted text-ink-muted",
                outline: "border-border-warm bg-transparent text-ink-muted",
            },
        },
        defaultVariants: {
            variant: "neutral",
        },
    },
);

function Badge({
    className,
    variant,
    ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
    return (
        <span data-slot="badge" className={cn(badgeVariants({ variant, className }))} {...props} />
    );
}

export { Badge, badgeVariants };
