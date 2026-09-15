"use client";

import * as React from "react";

import { Combobox as ComboboxPrimitive } from "@base-ui/react";
import { cva, type VariantProps } from "class-variance-authority";
import { Tailspin } from "ldrs/react";
import { CheckIcon, ChevronDownIcon, XIcon } from "lucide-react";

import { clearInputError, shakeInput } from "@/lib/motion/shake-input";
import { swapText } from "@/lib/motion/swap-text";
import { cn } from "@/lib/utils";

import "ldrs/react/Tailspin.css";

const comboboxInputGroupVariants = cva(
    `
      group/combobox-input relative flex items-center justify-between gap-1.5 rounded-control
      border-2 border-border-warm bg-surface text-[15px] whitespace-nowrap text-ink
      transition-[border-color,box-shadow] outline-none inline-full min-inline-0
      hover:border-ink-subtle
      has-[[data-slot=combobox-input]:focus-visible]:border-ring
      has-[[data-slot=combobox-input]:focus-visible]:ring-3
      has-[[data-slot=combobox-input]:focus-visible]:ring-ring/30
      data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:bg-surface-muted
      data-disabled:opacity-50
      data-disabled:hover:border-border-warm
      has-[[data-slot=combobox-input][aria-invalid=true]]:border-danger-mid
      has-[[data-slot=combobox-input][aria-invalid=true]]:hover:border-danger-mid
      has-[[data-slot=combobox-input][aria-invalid=true]:focus-visible]:ring-danger/20
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

const comboboxIconVariants = cva("shrink-0 text-ink-subtle", {
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

function ComboboxMessage({
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

const Combobox = ComboboxPrimitive.Root;

function ComboboxValue({ ...props }: ComboboxPrimitive.Value.Props) {
    return <ComboboxPrimitive.Value data-slot="combobox-value" {...props} />;
}

function ComboboxTrigger({
    className,
    children,
    ...props
}: ComboboxPrimitive.Trigger.Props) {
    return (
        <ComboboxPrimitive.Trigger
            data-slot="combobox-trigger"
            className={cn(
                `
                  flex shrink-0 items-center justify-center text-ink-subtle outline-none
                  disabled:pointer-events-none
                  [&_svg:not([class*='size-'])]:block-4 [&_svg:not([class*='size-'])]:inline-4
                `,
                className,
            )}
            {...props}
        >
            {children ?? (
                <ComboboxPrimitive.Icon
                    render={
                        <ChevronDownIcon
                            className="
                              transition-transform duration-160
                              group-data-popup-open/combobox-input:rotate-180
                            "
                        />
                    }
                />
            )}
        </ComboboxPrimitive.Trigger>
    );
}

function ComboboxClear({ className, ...props }: ComboboxPrimitive.Clear.Props) {
    return (
        <ComboboxPrimitive.Clear
            data-slot="combobox-clear"
            className={cn(
                `
                  flex shrink-0 items-center justify-center text-ink-subtle outline-none
                  hover:text-ink
                  disabled:pointer-events-none
                  [&_svg:not([class*='size-'])]:block-3.5 [&_svg:not([class*='size-'])]:inline-3.5
                `,
                className,
            )}
            {...props}
        >
            <XIcon className="pointer-events-none" />
        </ComboboxPrimitive.Clear>
    );
}

export type ComboboxInputProps = Omit<ComboboxPrimitive.Input.Props, "size"> &
    VariantProps<typeof comboboxInputGroupVariants> & {
        startIcon?: LucideIconComponent;
        loading?: boolean;
        success?: boolean;
        helperText?: React.ReactNode;
        errorText?: React.ReactNode;
        wrapperClassName?: string;
        showTrigger?: boolean;
        showClear?: boolean;
    };

function ComboboxInput({
    className,
    wrapperClassName,
    size = "default",
    startIcon,
    loading = false,
    success = false,
    helperText,
    errorText,
    showTrigger = true,
    showClear = false,
    disabled = false,
    id,
    ref,
    "aria-invalid": ariaInvalid,
    ...props
}: ComboboxInputProps) {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const messageId = `${inputId}-message`;
    const isInvalid = Boolean(ariaInvalid) || Boolean(errorText);
    const wrapRef = React.useRef<HTMLDivElement>(null);
    const inputRef = React.useRef<HTMLInputElement | null>(null);
    const wasInvalid = React.useRef(false);
    const StartIcon = startIcon;
    const hasMessage = Boolean(errorText || helperText);
    const isDisabled = disabled || loading;

    React.useEffect(() => {
        const wrap = wrapRef.current;
        const input = inputRef.current;
        if (!wrap || !input) {
            return;
        }
        if (isInvalid && !wasInvalid.current) {
            shakeInput(wrap, input);
        } else if (!isInvalid && wasInvalid.current) {
            clearInputError(wrap, input);
        }
        wasInvalid.current = isInvalid;
    }, [isInvalid]);

    function assignInputRef(node: HTMLInputElement | null) {
        inputRef.current = node;
        if (typeof ref === "function") {
            ref(node);
        } else if (ref) {
            ref.current = node;
        }
    }

    return (
        <div ref={wrapRef} className={cn("t-input-wrap inline-full", wrapperClassName)}>
            <ComboboxPrimitive.InputGroup
                data-slot="combobox-input-group"
                data-size={size}
                data-success={(success && !isInvalid) || undefined}
                data-loading={loading || undefined}
                className={cn(comboboxInputGroupVariants({ size }), className)}
            >
                {StartIcon ? (
                    <StartIcon className={cn(comboboxIconVariants({ size }))} aria-hidden="true" />
                ) : null}
                <ComboboxPrimitive.Input
                    {...props}
                    id={inputId}
                    ref={assignInputRef}
                    data-slot="combobox-input"
                    disabled={isDisabled}
                    aria-busy={loading || undefined}
                    aria-invalid={isInvalid || undefined}
                    aria-describedby={hasMessage ? messageId : undefined}
                    suppressHydrationWarning
                    className={cn(
                        `
                          min-inline-0 flex-1 bg-transparent text-start text-ink outline-none
                          placeholder:text-ink-subtle
                          disabled:cursor-not-allowed
                        `,
                    )}
                />
                <span
                    className={cn(
                        comboboxIconVariants({ size }),
                        "ms-auto flex shrink-0 items-center justify-center gap-1",
                    )}
                >
                    {loading ? (
                        <Tailspin size="16" stroke="2" speed="0.9" color="currentColor" />
                    ) : (
                        <>
                            {showClear ? <ComboboxClear disabled={isDisabled} /> : null}
                            {showTrigger ? <ComboboxTrigger disabled={isDisabled} /> : null}
                        </>
                    )}
                </span>
            </ComboboxPrimitive.InputGroup>

            <ComboboxMessage
                id={messageId}
                tone={errorText ? "error" : success && !isInvalid ? "success" : "helper"}
                shimmer={Boolean(loading && helperText && !errorText)}
            >
                {errorText ?? helperText}
            </ComboboxMessage>
        </div>
    );
}

function ComboboxContent({
    className,
    side = "bottom",
    sideOffset = 8,
    align = "start",
    alignOffset = 0,
    anchor,
    ...props
}: ComboboxPrimitive.Popup.Props &
    Pick<
        ComboboxPrimitive.Positioner.Props,
        "side" | "align" | "sideOffset" | "alignOffset" | "anchor"
    >) {
    return (
        <ComboboxPrimitive.Portal>
            <ComboboxPrimitive.Positioner
                side={side}
                sideOffset={sideOffset}
                align={align}
                alignOffset={alignOffset}
                anchor={anchor}
                className="isolate z-50"
            >
                <ComboboxPrimitive.Popup
                    data-slot="combobox-content"
                    data-chips={!!anchor}
                    className={cn(
                        `
                          t-dropdown group/combobox-content relative isolate z-50
                          origin-(--transform-origin) animate-none! overflow-x-hidden
                          overflow-y-auto rounded-card border border-border-warm bg-surface p-1.5
                          text-ink shadow-lg ring-0 inline-(--anchor-width)
                          max-block-(--available-height) min-inline-36
                          data-[chips=true]:min-inline-(--anchor-width)
                          data-open:animate-none!
                          data-closed:animate-none!
                        `,
                        className,
                    )}
                    {...props}
                />
            </ComboboxPrimitive.Positioner>
        </ComboboxPrimitive.Portal>
    );
}

function ComboboxList({ className, ...props }: ComboboxPrimitive.List.Props) {
    return (
        <ComboboxPrimitive.List
            data-slot="combobox-list"
            className={cn(
                `
                  no-scrollbar flex max-h-[min(calc(--spacing(72)-(--spacing(9))),calc(var(--available-height)-(--spacing(9))))]
                  flex-col scroll-py-1.5 overflow-y-auto overscroll-contain
                  data-empty:p-0
                `,
                className,
            )}
            {...props}
        />
    );
}

function ComboboxItem({
    className,
    children,
    ...props
}: ComboboxPrimitive.Item.Props) {
    return (
        <ComboboxPrimitive.Item
            data-slot="combobox-item"
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
            {children}
            <ComboboxPrimitive.ItemIndicator
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
            </ComboboxPrimitive.ItemIndicator>
        </ComboboxPrimitive.Item>
    );
}

function ComboboxGroup({ className, ...props }: ComboboxPrimitive.Group.Props) {
    return (
        <ComboboxPrimitive.Group
            data-slot="combobox-group"
            className={cn("flex scroll-my-1 flex-col", className)}
            {...props}
        />
    );
}

function ComboboxLabel({
    className,
    ...props
}: ComboboxPrimitive.GroupLabel.Props) {
    return (
        <ComboboxPrimitive.GroupLabel
            data-slot="combobox-label"
            className={cn("eyebrow px-2.5 py-1 text-ink-subtle", className)}
            {...props}
        />
    );
}

function ComboboxCollection({ ...props }: ComboboxPrimitive.Collection.Props) {
    return (
        <ComboboxPrimitive.Collection data-slot="combobox-collection" {...props} />
    );
}

function ComboboxEmpty({ className, ...props }: ComboboxPrimitive.Empty.Props) {
    return (
        <ComboboxPrimitive.Empty
            data-slot="combobox-empty"
            className={cn(
                `
                  hidden w-full justify-center py-2 text-center text-sm text-ink-subtle
                  group-data-empty/combobox-content:flex
                `,
                className,
            )}
            {...props}
        />
    );
}

function ComboboxSeparator({
    className,
    ...props
}: ComboboxPrimitive.Separator.Props) {
    return (
        <ComboboxPrimitive.Separator
            data-slot="combobox-separator"
            className={cn("pointer-events-none -mx-1 my-1 bg-border-warm block-px", className)}
            {...props}
        />
    );
}

function ComboboxChips({
    className,
    ...props
}: React.ComponentPropsWithRef<typeof ComboboxPrimitive.Chips> &
    ComboboxPrimitive.Chips.Props) {
    return (
        <ComboboxPrimitive.Chips
            data-slot="combobox-chips"
            className={cn(
                `
                  flex min-h-9 flex-wrap items-center gap-1.5 rounded-control border-2
                  border-border-warm bg-surface px-3 py-1.5 text-sm text-ink
                  transition-[color,box-shadow,background-color]
                  focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30
                  has-aria-invalid:border-danger-mid has-aria-invalid:ring-3
                  has-aria-invalid:ring-danger/20
                  has-data-[slot=combobox-chip]:px-1.5
                `,
                className,
            )}
            {...props}
        />
    );
}

function ComboboxChip({
    className,
    children,
    showRemove = true,
    ...props
}: ComboboxPrimitive.Chip.Props & {
    showRemove?: boolean;
}) {
    return (
        <ComboboxPrimitive.Chip
            data-slot="combobox-chip"
            className={cn(
                `
                  flex h-[calc(--spacing(5.5))] w-fit items-center justify-center gap-1
                  rounded-control bg-surface-muted px-2 text-xs font-medium whitespace-nowrap
                  text-ink
                  has-disabled:pointer-events-none has-disabled:cursor-not-allowed
                  has-disabled:opacity-50
                  has-data-[slot=combobox-chip-remove]:pe-0
                `,
                className,
            )}
            {...props}
        >
            {children}
            {showRemove && (
                <ComboboxPrimitive.ChipRemove
                    className="
                      -ms-1 flex items-center justify-center text-ink-subtle opacity-50
                      hover:opacity-100
                      [&_svg:not([class*='size-'])]:block-3 [&_svg:not([class*='size-'])]:inline-3
                    "
                    data-slot="combobox-chip-remove"
                >
                    <XIcon className="pointer-events-none" />
                </ComboboxPrimitive.ChipRemove>
            )}
        </ComboboxPrimitive.Chip>
    );
}

function ComboboxChipsInput({
    className,
    ...props
}: ComboboxPrimitive.Input.Props) {
    return (
        <ComboboxPrimitive.Input
            data-slot="combobox-chip-input"
            className={cn("min-w-16 flex-1 bg-transparent outline-none", className)}
            {...props}
        />
    );
}

function useComboboxAnchor() {
    return React.useRef<HTMLDivElement | null>(null);
}

export {
    Combobox,
    ComboboxInput,
    ComboboxContent,
    ComboboxList,
    ComboboxItem,
    ComboboxGroup,
    ComboboxLabel,
    ComboboxCollection,
    ComboboxEmpty,
    ComboboxSeparator,
    ComboboxChips,
    ComboboxChip,
    ComboboxChipsInput,
    ComboboxTrigger,
    ComboboxValue,
    ComboboxClear,
    useComboboxAnchor,
};
