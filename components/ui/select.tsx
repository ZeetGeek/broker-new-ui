"use client";

import * as React from "react";

import { Select as SelectPrimitive } from "@base-ui/react/select";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const Select = SelectPrimitive.Root;

function SelectGroup({ className, ...props }: SelectPrimitive.Group.Props) {
    return (
        <SelectPrimitive.Group
            data-slot="select-group"
            className={cn("scroll-my-1.5 p-1.5", className)}
            {...props}
        />
    );
}

function SelectValue({ className, ...props }: SelectPrimitive.Value.Props) {
    return (
        <SelectPrimitive.Value
            data-slot="select-value"
            className={cn("flex flex-1 text-start", className)}
            {...props}
        />
    );
}

function SelectTrigger({
    className,
    size = "default",
    children,
    ...props
}: SelectPrimitive.Trigger.Props & {
    size?: "sm" | "default";
}) {
    return (
        <SelectPrimitive.Trigger
            data-slot="select-trigger"
            data-size={size}
            className={cn(
                `
                  flex items-center justify-between gap-1.5 rounded-control border border-transparent
                  bg-input/50 px-3 py-2 text-sm whitespace-nowrap
                  transition-[color,box-shadow,background-color] outline-none inline-fit
                  focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30
                  disabled:cursor-not-allowed disabled:opacity-50
                  aria-invalid:border-destructive aria-invalid:ring-3
                  aria-invalid:ring-destructive/20
                  data-placeholder:text-muted-foreground
                  data-[size=default]:block-9
                  data-[size=sm]:block-8
                  *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex
                  *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5
                  dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40
                  [&_svg]:pointer-events-none [&_svg]:shrink-0
                  [&_svg:not([class*='size-'])]:block-4 [&_svg:not([class*='size-'])]:inline-4
                `,
                className,
            )}
            {...props}
        >
            {children}
            <SelectPrimitive.Icon
                render={
                    <ChevronDownIcon className="pointer-events-none text-muted-foreground block-4 inline-4" />
                }
            />
        </SelectPrimitive.Trigger>
    );
}

function SelectContent({
    className,
    children,
    side = "bottom",
    sideOffset = 4,
    align = "center",
    alignOffset = 0,
    alignItemWithTrigger = true,
    ...props
}: SelectPrimitive.Popup.Props &
    Pick<
        SelectPrimitive.Positioner.Props,
        "align" | "alignOffset" | "side" | "sideOffset" | "alignItemWithTrigger"
    >) {
    return (
        <SelectPrimitive.Portal>
            <SelectPrimitive.Positioner
                side={side}
                sideOffset={sideOffset}
                align={align}
                alignOffset={alignOffset}
                alignItemWithTrigger={alignItemWithTrigger}
                className="isolate z-50"
            >
                <SelectPrimitive.Popup
                    data-slot="select-content"
                    data-align-trigger={alignItemWithTrigger}
                    className={cn(
                        `
                          dark relative isolate z-50 origin-(--transform-origin) animate-none!
                          overflow-x-hidden overflow-y-auto rounded-card bg-popover/70
                          text-popover-foreground shadow-lg ring-1 ring-foreground/5 duration-100
                          inline-(--anchor-width) max-block-(--available-height) min-inline-36
                          before:pointer-events-none before:absolute before:inset-0 before:-z-1
                          before:rounded-[inherit] before:backdrop-blur-2xl
                          before:backdrop-saturate-150
                          data-[align-trigger=true]:animate-none
                          data-[side=bottom]:slide-in-from-top-2
                          data-[side=inline-end]:slide-in-from-start-2
                          data-[side=inline-start]:slide-in-from-end-2
                          data-[side=left]:slide-in-from-right-2
                          data-[side=right]:slide-in-from-left-2
                          data-[side=top]:slide-in-from-bottom-2
                          **:data-[slot$=-item]:focus:bg-foreground/10
                          **:data-[slot$=-item]:data-highlighted:bg-foreground/10
                          **:data-[slot$=-separator]:bg-foreground/5
                          **:data-[slot$=-trigger]:focus:bg-foreground/10
                          **:data-[slot$=-trigger]:aria-expanded:bg-foreground/10!
                          **:data-[variant=destructive]:**:text-accent-foreground!
                          **:data-[variant=destructive]:text-accent-foreground!
                          **:data-[variant=destructive]:focus:bg-foreground/10!
                          dark:ring-foreground/10
                          data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95
                          data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95
                        `,
                        className,
                    )}
                    {...props}
                >
                    <SelectScrollUpButton />
                    <SelectPrimitive.List>{children}</SelectPrimitive.List>
                    <SelectScrollDownButton />
                </SelectPrimitive.Popup>
            </SelectPrimitive.Positioner>
        </SelectPrimitive.Portal>
    );
}

function SelectLabel({ className, ...props }: SelectPrimitive.GroupLabel.Props) {
    return (
        <SelectPrimitive.GroupLabel
            data-slot="select-label"
            className={cn("px-3 py-2.5 text-xs text-muted-foreground", className)}
            {...props}
        />
    );
}

function SelectItem({ className, children, ...props }: SelectPrimitive.Item.Props) {
    return (
        <SelectPrimitive.Item
            data-slot="select-item"
            className={cn(
                `
                  relative flex cursor-default items-center gap-2.5 rounded-inner py-2 ps-3 pe-8
                  text-sm font-medium outline-hidden select-none inline-full
                  focus:bg-accent focus:text-accent-foreground
                  not-data-[variant=destructive]:focus:**:text-accent-foreground
                  data-disabled:pointer-events-none data-disabled:opacity-50
                  [&_svg]:pointer-events-none [&_svg]:shrink-0
                  [&_svg:not([class*='size-'])]:block-4 [&_svg:not([class*='size-'])]:inline-4
                  *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2
                `,
                className,
            )}
            {...props}
        >
            <SelectPrimitive.ItemText className="flex flex-1 shrink-0 gap-2 whitespace-nowrap">
                {children}
            </SelectPrimitive.ItemText>
            <SelectPrimitive.ItemIndicator
                render={
                    <span
                        className="
                          pointer-events-none absolute inset-e-2 flex items-center justify-center
                          block-4 inline-4
                        "
                    />
                }
            >
                <CheckIcon className="pointer-events-none" />
            </SelectPrimitive.ItemIndicator>
        </SelectPrimitive.Item>
    );
}

function SelectSeparator({ className, ...props }: SelectPrimitive.Separator.Props) {
    return (
        <SelectPrimitive.Separator
            data-slot="select-separator"
            className={cn("pointer-events-none -mx-1.5 my-1.5 bg-border block-px", className)}
            {...props}
        />
    );
}

function SelectScrollUpButton({
    className,
    ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpArrow>) {
    return (
        <SelectPrimitive.ScrollUpArrow
            data-slot="select-scroll-up-button"
            className={cn(
                `
                  inset-bs-0 z-10 flex cursor-default items-center justify-center bg-popover py-1
                  inline-full
                  [&_svg:not([class*='size-'])]:block-4 [&_svg:not([class*='size-'])]:inline-4
                `,
                className,
            )}
            {...props}
        >
            <ChevronUpIcon />
        </SelectPrimitive.ScrollUpArrow>
    );
}

function SelectScrollDownButton({
    className,
    ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownArrow>) {
    return (
        <SelectPrimitive.ScrollDownArrow
            data-slot="select-scroll-down-button"
            className={cn(
                `
                  inset-be-0 z-10 flex cursor-default items-center justify-center bg-popover py-1
                  inline-full
                  [&_svg:not([class*='size-'])]:block-4 [&_svg:not([class*='size-'])]:inline-4
                `,
                className,
            )}
            {...props}
        >
            <ChevronDownIcon />
        </SelectPrimitive.ScrollDownArrow>
    );
}

export {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectScrollDownButton,
    SelectScrollUpButton,
    SelectSeparator,
    SelectTrigger,
    SelectValue,
};
