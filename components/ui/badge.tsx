import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Soft top→bottom fill (padding-box) + tinted border gradient (border-box).
 * Transparent border lets the border-box layer show through the edge.
 */
const badgeVariants = cva(
    `
      inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-transparent
      px-3 py-1 text-[12px] font-semibold whitespace-nowrap
      [&_svg]:pointer-events-none [&_svg]:shrink-0
      [&_svg:not([class*='size-'])]:block-3 [&_svg:not([class*='size-'])]:inline-3
    `,
    {
        variants: {
            variant: {
                brand: `
                  text-brand-text
                  [background:linear-gradient(180deg,var(--color-surface),var(--color-brand-soft))_padding-box,linear-gradient(180deg,color-mix(in_oklab,var(--color-brand)_52%,white),color-mix(in_oklab,var(--color-brand)_28%,white))_border-box]
                  [box-shadow:0_2px_10px_-2px_color-mix(in_oklab,var(--color-brand)_22%,transparent),0_1px_2px_color-mix(in_oklab,var(--color-brand)_10%,transparent)]
                `,
                urgent: `
                  text-urgent
                  [background:linear-gradient(180deg,var(--color-surface),var(--color-urgent-soft))_padding-box,linear-gradient(180deg,color-mix(in_oklab,var(--color-urgent)_48%,white),color-mix(in_oklab,var(--color-urgent)_26%,white))_border-box]
                  [box-shadow:0_2px_10px_-2px_color-mix(in_oklab,var(--color-urgent)_20%,transparent),0_1px_2px_color-mix(in_oklab,var(--color-urgent)_10%,transparent)]
                `,
                danger: `
                  text-danger
                  [background:linear-gradient(180deg,var(--color-surface),var(--color-danger-soft))_padding-box,linear-gradient(180deg,color-mix(in_oklab,var(--color-danger)_48%,white),color-mix(in_oklab,var(--color-danger)_26%,white))_border-box]
                  [box-shadow:0_2px_10px_-2px_color-mix(in_oklab,var(--color-danger)_20%,transparent),0_1px_2px_color-mix(in_oklab,var(--color-danger)_10%,transparent)]
                `,
                neutral: `
                  text-ink
                  [background:linear-gradient(180deg,var(--color-surface),var(--color-surface-muted))_padding-box,linear-gradient(180deg,var(--color-border-warm),color-mix(in_oklab,var(--color-border-warm)_70%,white))_border-box]
                  [box-shadow:0_2px_10px_-2px_oklch(0.153_0.02_155_/_0.1),0_1px_2px_oklch(0.153_0.02_155_/_0.05)]
                `,
                outline: `
                  text-ink-muted
                  [background:linear-gradient(180deg,var(--color-surface),var(--color-surface))_padding-box,linear-gradient(180deg,var(--color-border-warm),color-mix(in_oklab,var(--color-border-warm)_65%,white))_border-box]
                  [box-shadow:0_2px_8px_-2px_oklch(0.153_0.02_155_/_0.08),0_1px_2px_oklch(0.153_0.02_155_/_0.04)]
                `,
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
