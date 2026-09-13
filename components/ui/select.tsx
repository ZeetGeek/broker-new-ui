"use client";

import * as React from "react";

import { Select as SelectPrimitive } from "@base-ui/react/select";
import { cva, type VariantProps } from "class-variance-authority";
import { Tailspin } from "ldrs/react";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";

import { clearInputError, shakeInput } from "@/lib/motion/shake-input";
import { swapText } from "@/lib/motion/swap-text";
import { cn } from "@/lib/utils";

import "ldrs/react/Tailspin.css";

const selectTriggerVariants = cva(
    `
      group/select-trigger relative flex items-center justify-between gap-1.5 rounded-control
      border-2 border-border-warm bg-surface text-[15px] whitespace-nowrap text-ink
      transition-[border-color,box-shadow] outline-none inline-full min-inline-0
      hover:border-ink-subtle
      focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30
      disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-surface-muted
      disabled:opacity-50
      disabled:hover:border-border-warm
      aria-invalid:border-danger-mid
      aria-invalid:hover:border-danger-mid
      aria-invalid:focus-visible:ring-danger/20
      data-loading:pointer-events-none
      data-placeholder:text-ink-subtle
      data-popup-open:border-ring
      data-success:border-success-mid
      data-success:hover:border-success-mid
      [&_svg]:pointer-events-none [&_svg]:shrink-0
    `,
    {
        variants: {
            size: {
                xs: "gap-1 px-2.5 text-xs block-control-xs",
                sm: "gap-1 px-3 text-[13px] block-control-sm",
                default: "gap-1.5 px-3.5 block-control-md",
                md: "gap-1.5 px-4 block-control-lg",
                lg: "gap-2 px-4 text-base block-control-xl",
            },
        },
        defaultVariants: {
            size: "default",
        },
    },
);

const selectIconVariants = cva("shrink-0 text-ink-subtle", {
    variants: {
        size: {
            xs: "block-3 inline-3",
            sm: "block-3.5 inline-3.5",
            default: "block-4 inline-4",
            md: "block-4 inline-4",
            lg: "block-4.5 inline-4.5",
        },
    },
    defaultVariants: {
        size: "default",
    },
});

type LucideIconProps = React.SVGProps<SVGSVGElement> & {
    size?: number | string;
    strokeWidth?: number;
    color?: string;
};
type LucideIconComponent = React.ComponentType<LucideIconProps>;

function messageAsText(children: React.ReactNode): string {
    if (children == null || typeof children === "boolean") {
        return "";
    }
    if (typeof children === "string" || typeof children === "number") {
        return String(children);
    }
    return "";
}

function SelectMessage({
    id,
    tone,
    shimmer,
    children,
}: {
    id: string;
    tone: "error" | "success" | "helper";
    shimmer?: boolean;
    children: React.ReactNode;
}) {
    const ref = React.useRef<HTMLParagraphElement>(null);
    const previousText = React.useRef("");
    const text = messageAsText(children);

    React.useLayoutEffect(() => {
        const element = ref.current;
        if (!element) {
            previousText.current = "";
            return;
        }
        if (previousText.current === text) {
            if (!element.textContent) {
                element.textContent = text;
            }
            return;
        }
        if (previousText.current) {
            swapText(element, text);
        } else {
            element.textContent = text;
        }
        previousText.current = text;
    }, [text]);

    if (!text) {
        return null;
    }

    return (
        <p
            ref={ref}
            id={id}
            role={tone === "error" ? "alert" : undefined}
            data-text={shimmer ? text : undefined}
            className={cn(
                "t-text-swap body-sm mbs-1.5",
                tone === "error"
                    ? "text-danger"
                    : tone === "success"
                      ? "text-success"
                      : "text-ink-subtle",
                shimmer && "t-shimmer",
            )}
        />
    );
}

const Select = SelectPrimitive.Root;

function SelectGroup({ className, ...props }: SelectPrimitive.Group.Props) {
    return (
        <SelectPrimitive.Group
            data-slot="select-group"
            className={cn("flex scroll-my-1 flex-col", className)}
            {...props}
        />
    );
}

function SelectValue({ className, ...props }: SelectPrimitive.Value.Props) {
    return (
        <SelectPrimitive.Value
            data-slot="select-value"
            className={cn(
                `flex flex-1 text-start min-inline-0 data-placeholder:text-ink-subtle`,
                className,
            )}
            {...props}
        />
    );
}

export type SelectTriggerProps = Omit<SelectPrimitive.Trigger.Props, "size"> &
    VariantProps<typeof selectTriggerVariants> & {
        startIcon?: LucideIconComponent;
        loading?: boolean;
        success?: boolean;
        helperText?: React.ReactNode;
        errorText?: React.ReactNode;
        wrapperClassName?: string;
    };

function SelectTrigger({
    className,
    wrapperClassName,
    size = "default",
    startIcon,
    loading = false,
    success = false,
    helperText,
    errorText,
    children,
    disabled,
    id,
    ref,
    "aria-invalid": ariaInvalid,
    ...props
}: SelectTriggerProps) {
    const generatedId = React.useId();
    const triggerId = id ?? generatedId;
    const messageId = `${triggerId}-message`;
    const isInvalid = Boolean(ariaInvalid) || Boolean(errorText);
    const wrapRef = React.useRef<HTMLDivElement>(null);
    const triggerRef = React.useRef<HTMLButtonElement | null>(null);
    const wasInvalid = React.useRef(false);
    const StartIcon = startIcon;
    const hasMessage = Boolean(errorText || helperText);

    React.useEffect(() => {
        const wrap = wrapRef.current;
        const trigger = triggerRef.current;
        if (!wrap || !trigger) {
            return;
        }
        if (isInvalid && !wasInvalid.current) {
            shakeInput(wrap, trigger);
        } else if (!isInvalid && wasInvalid.current) {
            clearInputError(wrap, trigger);
        }
        wasInvalid.current = isInvalid;
    }, [isInvalid]);

    function assignTriggerRef(node: HTMLButtonElement | null) {
        triggerRef.current = node;
        if (typeof ref === "function") {
            ref(node);
        } else if (ref) {
            ref.current = node;
        }
    }

    return (
        <div ref={wrapRef} className={cn("t-input-wrap inline-full", wrapperClassName)}>
            <SelectPrimitive.Trigger
                id={triggerId}
                ref={assignTriggerRef}
                data-slot="select-trigger"
                data-size={size}
                data-success={(success && !isInvalid) || undefined}
                data-loading={loading || undefined}
                disabled={disabled || loading}
                aria-busy={loading || undefined}
                aria-invalid={isInvalid || undefined}
                aria-describedby={hasMessage ? messageId : undefined}
                className={cn(selectTriggerVariants({ size }), className)}
                {...props}
            >
                {StartIcon ? (
                    <StartIcon className={cn(selectIconVariants({ size }))} aria-hidden="true" />
                ) : null}
                {children}
                <span
                    className={cn(
                        selectIconVariants({ size }),
                        "ms-auto flex shrink-0 items-center justify-center",
                    )}
                >
                    {loading ? (
                        <Tailspin size="16" stroke="2" speed="0.9" color="currentColor" />
                    ) : (
                        <SelectPrimitive.Icon
                            render={
                                <ChevronDownIcon
                                    className="
                                      transition-transform duration-160
                                      group-data-popup-open/select-trigger:rotate-180
                                    "
                                />
                            }
                        />
                    )}
                </span>
            </SelectPrimitive.Trigger>

            <SelectMessage
                id={messageId}
                tone={errorText ? "error" : success && !isInvalid ? "success" : "helper"}
                shimmer={Boolean(loading && helperText && !errorText)}
            >
                {errorText ?? helperText}
            </SelectMessage>
        </div>
    );
}

function SelectContent({
    className,
    children,
    side = "bottom",
    sideOffset = 8,
    align = "start",
    alignOffset = 0,
    ...props
}: SelectPrimitive.Popup.Props &
    Pick<SelectPrimitive.Positioner.Props, "align" | "alignOffset" | "side" | "sideOffset">) {
    return (
        <SelectPrimitive.Portal>
            <SelectPrimitive.Positioner
                side={side}
                sideOffset={sideOffset}
                align={align}
                alignOffset={alignOffset}
                alignItemWithTrigger={false}
                className="isolate z-50"
            >
                <SelectPrimitive.Popup
                    data-slot="select-content"
                    data-align-trigger={false}
                    className={cn(
                        `
                          t-dropdown relative isolate z-50 origin-(--transform-origin) animate-none!
                          overflow-x-hidden overflow-y-auto rounded-card border border-border-warm
                          bg-surface p-1.5 text-ink shadow-lg ring-0 inline-(--anchor-width)
                          max-block-(--available-height) min-inline-36
                          data-open:animate-none!
                          data-closed:animate-none!
                        `,
                        className,
                    )}
                    {...props}
                >
                    <SelectScrollUpButton />
                    <SelectPrimitive.List className="flex flex-col">{children}</SelectPrimitive.List>
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
            className={cn("eyebrow px-2.5 py-1 text-ink-subtle", className)}
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
                  relative flex cursor-pointer items-center gap-2 rounded-inner px-2.5 py-2 pe-8
                  text-[15px] font-medium text-ink outline-hidden
                  transition-[background-color,color] duration-160
                  ease-[cubic-bezier(0.22,1,0.36,1)] select-none inline-full
                  data-highlighted:bg-surface-muted data-highlighted:text-ink
                  data-disabled:pointer-events-none data-disabled:opacity-50
                  [&_svg]:pointer-events-none [&_svg]:shrink-0
                  [&_svg:not([class*='size-'])]:block-4 [&_svg:not([class*='size-'])]:inline-4
                `,
                className,
            )}
            {...props}
        >
            <SelectPrimitive.ItemText className="
              flex flex-1 items-center gap-2 truncate min-inline-0
            ">
                {children}
            </SelectPrimitive.ItemText>
            <SelectPrimitive.ItemIndicator
                render={
                    <span
                        className="
                          pointer-events-none absolute inset-e-2 flex items-center justify-center
                          text-brand block-4 inline-4
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
            className={cn("pointer-events-none -mx-1 my-1 bg-border-warm block-px", className)}
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
                  inset-bs-0 z-10 flex cursor-default items-center justify-center bg-surface py-1
                  text-ink-muted inline-full
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
                  inset-be-0 z-10 flex cursor-default items-center justify-center bg-surface py-1
                  text-ink-muted inline-full
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
