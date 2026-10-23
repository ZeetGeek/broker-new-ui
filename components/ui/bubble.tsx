"use client";

import * as React from "react";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

function BubbleGroup({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="bubble-group"
            className={cn("flex flex-col gap-2 min-inline-0", className)}
            {...props}
        />
    );
}

const bubbleVariants = cva(
    `
      group/bubble relative flex flex-col gap-1 inline-fit max-inline-[80%] min-inline-0
      group-data-[align=end]/message:self-end
      data-[align=end]:self-end
      data-[variant=ghost]:max-inline-full
    `,
    {
        variants: {
            variant: {
                default: cn(`
                  *:data-[slot=bubble-content]:bg-brand *:data-[slot=bubble-content]:text-surface
                  [&>[data-slot=bubble-content]:is(button,a):hover]:bg-brand/85
                `),
                secondary: cn(`
                  *:data-[slot=bubble-content]:bg-secondary
                  *:data-[slot=bubble-content]:text-secondary-foreground
                  [&>[data-slot=bubble-content]:is(button,a):hover]:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]
                `),
                muted: `
                  *:data-[slot=bubble-content]:bg-surface-muted
                  *:data-[slot=bubble-content]:text-ink
                  [&>[data-slot=bubble-content]:is(button,a):hover]:bg-canvas
                `,
                tinted: `
                  *:data-[slot=bubble-content]:bg-brand-soft
                  *:data-[slot=bubble-content]:text-brand-ink
                  [&>[data-slot=bubble-content]:is(button,a):hover]:bg-brand-soft-hover
                `,
                outline: cn(`
                  *:data-[slot=bubble-content]:border-border
                  *:data-[slot=bubble-content]:bg-background
                  [&>[data-slot=bubble-content]:is(button,a):hover]:bg-muted
                  [&>[data-slot=bubble-content]:is(button,a):hover]:text-foreground
                  dark:[&>[data-slot=bubble-content]:is(button,a):hover]:bg-input/30
                `),
                ghost: `
                  border-none
                  *:data-[slot=bubble-content]:rounded-none
                  *:data-[slot=bubble-content]:bg-transparent *:data-[slot=bubble-content]:p-0
                  [&>[data-slot=bubble-content]:is(button,a):hover]:bg-muted
                  [&>[data-slot=bubble-content]:is(button,a):hover]:text-foreground
                  dark:[&>[data-slot=bubble-content]:is(button,a):hover]:bg-muted/50
                `,
                destructive: cn(`
                  *:data-[slot=bubble-content]:bg-destructive/10
                  *:data-[slot=bubble-content]:text-destructive
                  dark:*:data-[slot=bubble-content]:bg-destructive/20
                  [&>[data-slot=bubble-content]:is(button,a):hover]:bg-destructive/20
                  dark:[&>[data-slot=bubble-content]:is(button,a):hover]:bg-destructive/30
                `),
            },
        },
        defaultVariants: {
            variant: "default",
        },
    },
);

function Bubble({
    variant = "default",
    align = "start",
    className,
    ...props
}: React.ComponentProps<"div"> &
    VariantProps<typeof bubbleVariants> & {
        align?: "start" | "end";
    }) {
    return (
        <div
            data-slot="bubble"
            data-variant={variant}
            data-align={align}
            className={cn(bubbleVariants({ variant }), className)}
            {...props}
        />
    );
}

function BubbleContent({ className, render, ...props }: useRender.ComponentProps<"div">) {
    return useRender({
        defaultTagName: "div",
        props: mergeProps<"div">(
            {
                className: cn(
                    `
                      overflow-hidden rounded-inner border border-transparent px-4 py-3
                      text-sm/relaxed wrap-anywhere inline-fit max-inline-full min-inline-0
                      group-data-[align=end]/bubble:self-end
                      [button]:text-start
                      [button,a]:transition-colors [button,a]:outline-none
                      [button,a]:focus-visible:border-ring [button,a]:focus-visible:ring-3
                      [button,a]:focus-visible:ring-ring/30
                    `,
                    className,
                ),
            },
            props,
        ),
        render,
        state: {
            slot: "bubble-content",
        },
    });
}

const bubbleReactionsVariants = cva(
    `
      absolute z-10 flex shrink-0 items-center justify-center gap-1 rounded-full bg-muted px-1.5
      py-0.5 text-sm ring-3 ring-card inline-fit
      has-[button]:p-0
    `,
    {
        variants: {
            side: {
                top: "inset-bs-0 -translate-y-3/4",
                bottom: "inset-be-0 translate-y-3/4",
            },
            align: {
                start: "inset-s-3",
                end: "inset-e-3",
            },
        },
        defaultVariants: {
            side: "bottom",
            align: "end",
        },
    },
);

function BubbleReactions({
    side = "bottom",
    align = "end",
    className,
    ...props
}: React.ComponentProps<"div"> & {
    align?: "start" | "end";
    side?: "top" | "bottom";
}) {
    return (
        <div
            data-slot="bubble-reactions"
            data-align={align}
            data-side={side}
            className={cn(bubbleReactionsVariants({ side, align }), className)}
            {...props}
        />
    );
}

export { Bubble, BubbleContent, BubbleGroup, BubbleReactions };
