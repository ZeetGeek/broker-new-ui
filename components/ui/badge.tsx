import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
    `
      inline-flex shrink-0 items-center gap-1 rounded-control border px-2.5 py-1
      text-[12px] font-semibold whitespace-nowrap
      [&_svg]:pointer-events-none [&_svg]:shrink-0
      [&_svg:not([class*='size-'])]:block-3 [&_svg:not([class*='size-'])]:inline-3
    `,
    {
        variants: {
            variant: {
                brand: "border-brand/20 bg-brand-soft text-brand-text",
                urgent: "border-urgent/25 bg-urgent-soft text-urgent",
                danger: "border-danger/25 bg-danger-soft text-danger",
                neutral: "border-border-warm bg-surface-muted text-ink",
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
