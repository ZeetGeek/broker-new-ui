"use client";

import * as React from "react";

import { Menu as MenuPrimitive } from "@base-ui/react/menu";

import { cn } from "@/lib/utils";

import { CheckIcon, ChevronRightIcon } from "@/components/shared/icons";

function DropdownMenu({ ...props }: MenuPrimitive.Root.Props) {
    return <MenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

function DropdownMenuPortal({ ...props }: MenuPrimitive.Portal.Props) {
    return <MenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />;
}

function DropdownMenuTrigger({ ...props }: MenuPrimitive.Trigger.Props) {
    return <MenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />;
}

function DropdownMenuContent({
    align = "start",
    alignOffset = 0,
    side = "bottom",
    sideOffset = 8,
    className,
    ...props
}: MenuPrimitive.Popup.Props &
    Pick<MenuPrimitive.Positioner.Props, "align" | "alignOffset" | "side" | "sideOffset">) {
    return (
        <MenuPrimitive.Portal>
            <MenuPrimitive.Positioner
                className="isolate z-50 outline-none"
                align={align}
                alignOffset={alignOffset}
                side={side}
                sideOffset={sideOffset}
            >
                <MenuPrimitive.Popup
                    data-slot="dropdown-menu-content"
                    className={cn(
                        `
                          t-dropdown relative isolate z-50 origin-(--transform-origin) animate-none!
                          overflow-x-hidden overflow-y-auto overscroll-contain rounded-card border border-border-warm
                          bg-surface p-1.5 text-ink shadow-lg ring-0 outline-none
                          inline-(--anchor-width) max-block-(--available-height) min-inline-48
                          data-open:animate-none! data-closed:animate-none!
                        `,
                        className,
                    )}
                    {...props}
                />
            </MenuPrimitive.Positioner>
        </MenuPrimitive.Portal>
    );
}

function DropdownMenuGroup({ ...props }: MenuPrimitive.Group.Props) {
    return <MenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />;
}

function DropdownMenuLabel({
    className,
    inset,
    ...props
}: MenuPrimitive.GroupLabel.Props & {
    inset?: boolean;
}) {
    return (
        <MenuPrimitive.GroupLabel
            data-slot="dropdown-menu-label"
            data-inset={inset}
            className={cn("eyebrow px-2.5 py-1 text-ink-subtle data-inset:ps-9.5", className)}
            {...props}
        />
    );
}

function DropdownMenuItem({
    className,
    inset,
    variant = "default",
    ...props
}: MenuPrimitive.Item.Props & {
    inset?: boolean;
    variant?: "default" | "destructive";
}) {
    return (
        <MenuPrimitive.Item
            data-slot="dropdown-menu-item"
            data-inset={inset}
            data-variant={variant}
            className={cn(
                `
                  group/dropdown-menu-item relative flex cursor-pointer items-center gap-2
                  rounded-inner px-2.5 py-2 text-[15px] font-medium text-ink outline-hidden transition-[background-color,color]
                  duration-160 ease-[cubic-bezier(0.22,1,0.36,1)]
                  select-none focus:bg-surface-muted
                  focus:text-ink not-data-[variant=destructive]:focus:**:text-ink
                  data-highlighted:bg-surface-muted
                  data-highlighted:text-ink
                  data-inset:ps-9.5
                  data-[variant=destructive]:text-danger
                  data-[variant=destructive]:focus:bg-danger-soft
                  data-[variant=destructive]:focus:text-danger
                  data-[variant=destructive]:data-highlighted:bg-danger-soft
                  data-[variant=destructive]:data-highlighted:text-danger
                  data-disabled:pointer-events-none data-disabled:opacity-50
                  [&_svg]:pointer-events-none [&_svg]:shrink-0
                  [&_svg:not([class*='size-'])]:block-4 [&_svg:not([class*='size-'])]:inline-4
                  data-[variant=destructive]:*:[svg]:text-danger
                `,
                className,
            )}
            {...props}
        />
    );
}

function DropdownMenuSub({ ...props }: MenuPrimitive.SubmenuRoot.Props) {
    return <MenuPrimitive.SubmenuRoot data-slot="dropdown-menu-sub" {...props} />;
}

function DropdownMenuSubTrigger({
    className,
    inset,
    children,
    ...props
}: MenuPrimitive.SubmenuTrigger.Props & {
    inset?: boolean;
}) {
    return (
        <MenuPrimitive.SubmenuTrigger
            data-slot="dropdown-menu-sub-trigger"
            data-inset={inset}
            className={cn(
                `
                  flex cursor-pointer items-center gap-2 rounded-inner px-2.5 py-2 text-[15px] font-medium text-ink
                  outline-hidden transition-[background-color,color]
                  duration-160 ease-[cubic-bezier(0.22,1,0.36,1)]
                  select-none focus:bg-surface-muted
                  focus:text-ink not-data-[variant=destructive]:focus:**:text-ink
                  data-highlighted:bg-surface-muted
                  data-highlighted:text-ink
                  data-inset:ps-9.5
                  data-popup-open:bg-surface-muted data-popup-open:text-ink
                  data-open:bg-surface-muted data-open:text-ink
                  [&_svg]:pointer-events-none [&_svg]:shrink-0
                  [&_svg:not([class*='size-'])]:block-4 [&_svg:not([class*='size-'])]:inline-4
                `,
                className,
            )}
            {...props}
        >
            {children}
            <ChevronRightIcon className="ms-auto rtl:rotate-180" />
        </MenuPrimitive.SubmenuTrigger>
    );
}

function DropdownMenuSubContent({
    align = "start",
    alignOffset = -3,
    side = "inline-end",
    sideOffset = 0,
    className,
    ...props
}: React.ComponentProps<typeof DropdownMenuContent>) {
    return (
        <DropdownMenuContent
            data-slot="dropdown-menu-sub-content"
            className={cn(
                `inline-auto min-inline-36
                `,
                className,
            )}
            align={align}
            alignOffset={alignOffset}
            side={side}
            sideOffset={sideOffset}
            {...props}
        />
    );
}

function DropdownMenuCheckboxItem({
    className,
    children,
    checked,
    inset,
    ...props
}: MenuPrimitive.CheckboxItem.Props & {
    inset?: boolean;
}) {
    return (
        <MenuPrimitive.CheckboxItem
            data-slot="dropdown-menu-checkbox-item"
            data-inset={inset}
            className={cn(
                `
                  relative flex cursor-pointer items-center gap-2 rounded-inner py-2 ps-2.5 pe-8
                  text-[15px] font-medium text-ink outline-hidden transition-[background-color,color]
                  duration-160 ease-[cubic-bezier(0.22,1,0.36,1)]
                  select-none focus:bg-surface-muted
                  focus:text-ink focus:**:text-ink
                  data-highlighted:bg-surface-muted
                  data-highlighted:text-ink
                  data-inset:ps-9.5
                  data-disabled:pointer-events-none data-disabled:opacity-50
                  [&_svg]:pointer-events-none [&_svg]:shrink-0
                  [&_svg:not([class*='size-'])]:block-4 [&_svg:not([class*='size-'])]:inline-4
                `,
                className,
            )}
            checked={checked}
            {...props}
        >
            <span
                className="pointer-events-none absolute inset-e-2 flex items-center justify-center text-brand block-4 inline-4"
                data-slot="dropdown-menu-checkbox-item-indicator"
            >
                <MenuPrimitive.CheckboxItemIndicator>
                    <CheckIcon />
                </MenuPrimitive.CheckboxItemIndicator>
            </span>
            {children}
        </MenuPrimitive.CheckboxItem>
    );
}

function DropdownMenuRadioGroup({ ...props }: MenuPrimitive.RadioGroup.Props) {
    return <MenuPrimitive.RadioGroup data-slot="dropdown-menu-radio-group" {...props} />;
}

function DropdownMenuRadioItem({
    className,
    children,
    inset,
    ...props
}: MenuPrimitive.RadioItem.Props & {
    inset?: boolean;
}) {
    return (
        <MenuPrimitive.RadioItem
            data-slot="dropdown-menu-radio-item"
            data-inset={inset}
            className={cn(
                `
                  relative flex cursor-pointer items-center gap-2 rounded-inner py-2 ps-2.5 pe-8
                  text-[15px] font-medium text-ink outline-hidden transition-[background-color,color]
                  duration-160 ease-[cubic-bezier(0.22,1,0.36,1)]
                  select-none focus:bg-surface-muted
                  focus:text-ink focus:**:text-ink
                  data-highlighted:bg-surface-muted
                  data-highlighted:text-ink
                  data-inset:ps-9.5
                  data-disabled:pointer-events-none data-disabled:opacity-50
                  [&_svg]:pointer-events-none [&_svg]:shrink-0
                  [&_svg:not([class*='size-'])]:block-4 [&_svg:not([class*='size-'])]:inline-4
                `,
                className,
            )}
            {...props}
        >
            <span
                className="pointer-events-none absolute inset-e-2 flex items-center justify-center text-brand block-4 inline-4"
                data-slot="dropdown-menu-radio-item-indicator"
            >
                <MenuPrimitive.RadioItemIndicator>
                    <CheckIcon />
                </MenuPrimitive.RadioItemIndicator>
            </span>
            {children}
        </MenuPrimitive.RadioItem>
    );
}

function DropdownMenuSeparator({ className, ...props }: MenuPrimitive.Separator.Props) {
    return (
        <MenuPrimitive.Separator
            data-slot="dropdown-menu-separator"
            className={cn("pointer-events-none -mx-1 my-1 bg-border-warm block-px", className)}
            {...props}
        />
    );
}

function DropdownMenuShortcut({ className, ...props }: React.ComponentProps<"span">) {
    return (
        <span
            data-slot="dropdown-menu-shortcut"
            className={cn(
                `
                  ms-auto text-xs tracking-widest text-ink-subtle
                  group-focus/dropdown-menu-item:text-ink
                `,
                className,
            )}
            {...props}
        />
    );
}

export {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
};
