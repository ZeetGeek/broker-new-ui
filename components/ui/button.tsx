import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { Tailspin } from "ldrs/react";

import { cn } from "@/lib/utils";

import "ldrs/react/Tailspin.css";

const buttonVariants = cva(
    `
      group/button inline-flex shrink-0 items-center justify-center rounded-control border
      border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap transition-all
      duration-160 ease-out outline-none select-none
      focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30
      active:not-aria-[haspopup]:translate-y-px active:not-aria-[haspopup]:scale-[0.97]
      disabled:pointer-events-none disabled:opacity-50
      aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20
      data-loading:pointer-events-none data-loading:opacity-80
      dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40
      [&_svg]:pointer-events-none [&_svg]:shrink-0
      [&_svg:not([class*='size-'])]:block-4 [&_svg:not([class*='size-'])]:inline-4
    `,
    {
        variants: {
            variant: {
                default: `bg-primary text-primary-foreground hover:bg-primary/80`,
                outline: `
                  border-border bg-background
                  hover:bg-muted hover:text-foreground
                  aria-expanded:bg-muted aria-expanded:text-foreground
                  dark:bg-transparent
                  dark:hover:bg-input/30
                `,
                secondary: `
                  bg-secondary text-secondary-foreground
                  hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]
                  aria-expanded:bg-secondary aria-expanded:text-secondary-foreground
                `,
                ghost: `
                  hover:bg-muted hover:text-foreground
                  aria-expanded:bg-muted aria-expanded:text-foreground
                  dark:hover:bg-muted/50
                `,
                destructive: `
                  bg-destructive/10 text-destructive
                  hover:bg-destructive/20
                  focus-visible:border-destructive/40 focus-visible:ring-destructive/20
                  dark:bg-destructive/20
                  dark:hover:bg-destructive/30
                  dark:focus-visible:ring-destructive/40
                `,
                link: `text-primary underline-offset-4 hover:underline`,
            },
            size: {
                default: `
                  gap-1.5 px-3 block-9 inline-auto min-inline-9
                  has-data-[icon=inline-end]:pe-2.5
                  has-data-[icon=inline-start]:ps-2.5
                `,
                xs: `
                  gap-1 px-2.5 text-xs block-6 inline-auto min-inline-6
                  has-data-[icon=inline-end]:pe-2
                  has-data-[icon=inline-start]:ps-2
                  [&_svg:not([class*='size-'])]:block-3 [&_svg:not([class*='size-'])]:inline-3
                `,
                sm: `
                  gap-1 px-3 block-8 inline-auto min-inline-8
                  has-data-[icon=inline-end]:pe-2
                  has-data-[icon=inline-start]:ps-2
                `,
                lg: `
                  gap-1.5 px-5 block-10 inline-auto min-inline-10
                  has-data-[icon=inline-end]:pe-4
                  has-data-[icon=inline-start]:ps-4
                `,
                icon: `block-9 inline-9`,
                "icon-xs": `
                  block-6 inline-6
                  [&_svg:not([class*='size-'])]:block-3 [&_svg:not([class*='size-'])]:inline-3
                `,
                "icon-sm": `block-8 inline-8`,
                "icon-lg": `block-10 inline-10`,
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    },
);

function ButtonSpinner({ className }: { className?: string }) {
    return (
        <span className={cn("inline-flex shrink-0 block-4 inline-4", className)} aria-hidden="true">
            <Tailspin size="16" stroke="2" speed="0.9" color="currentColor" />
        </span>
    );
}

function Button({
    className,
    variant = "default",
    size = "default",
    loading = false,
    disabled,
    children,
    ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants> & { loading?: boolean }) {
    return (
        <ButtonPrimitive
            data-slot="button"
            data-loading={loading || undefined}
            disabled={disabled ?? loading}
            aria-busy={loading || undefined}
            className={cn(buttonVariants({ variant, size, className }))}
            {...props}
        >
            {loading && <ButtonSpinner />}
            {children}
        </ButtonPrimitive>
    );
}

export { Button, buttonVariants };
