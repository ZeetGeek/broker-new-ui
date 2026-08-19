"use client";

import * as React from "react";

import { Input as InputPrimitive } from "@base-ui/react/input";
import {
    AlertCircleIcon,
    CancelCircleIcon,
    CheckmarkCircle02Icon,
    EyeIcon,
    EyeOffIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cva, type VariantProps } from "class-variance-authority";
import { Tailspin } from "ldrs/react";
import { AnimatePresence, motion } from "motion/react";

import { duration, ease } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

import "ldrs/react/Tailspin.css";

const inputVariants = cva(
    `
      peer rounded-inner border-2 border-border-warm bg-surface text-[15px] text-ink
      transition-[border-color,box-shadow] outline-none inline-full min-inline-0
      file:inline-flex file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-ink
      file:block-7
      placeholder:text-ink-subtle
      hover:border-ink-subtle
      focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30
      disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-surface-muted
      disabled:opacity-50
      disabled:hover:border-border-warm
      aria-invalid:border-danger
      aria-invalid:hover:border-danger
      aria-invalid:focus-visible:ring-danger/20
      data-loading:pointer-events-none
      data-success:border-brand
      data-success:hover:border-brand
    `,
    {
        variants: {
            size: {
                sm: "px-3 text-[13px] block-8",
                default: "px-3.5 block-9 md:block-9",
                lg: "px-4 text-base block-11 md:block-10",
            },
            hasStartSlot: {
                true: "",
                false: "",
            },
            hasEndSlot: {
                true: "",
                false: "",
            },
        },
        compoundVariants: [
            { size: "sm", hasStartSlot: true, className: "ps-8" },
            { size: "default", hasStartSlot: true, className: "ps-9.5" },
            { size: "lg", hasStartSlot: true, className: "ps-11" },
            { size: "sm", hasEndSlot: true, className: "pe-8" },
            { size: "default", hasEndSlot: true, className: "pe-9.5" },
            { size: "lg", hasEndSlot: true, className: "pe-11" },
        ],
        defaultVariants: {
            size: "default",
        },
    },
);

const iconSlotVariants = cva(
    `pointer-events-none absolute inset-y-0 flex items-center text-ink-subtle`,
    {
        variants: {
            size: {
                sm: "[&_svg]:block-3.5 [&_svg]:inline-3.5",
                default: "[&_svg]:block-4 [&_svg]:inline-4",
                lg: "[&_svg]:block-4.5 [&_svg]:inline-4.5",
            },
            side: {
                start: "",
                end: "",
            },
        },
        compoundVariants: [
            { side: "start", size: "sm", className: "inset-s-2.5" },
            { side: "start", size: "default", className: "inset-s-3" },
            { side: "start", size: "lg", className: "inset-s-3.5" },
            { side: "end", size: "sm", className: "inset-e-2.5" },
            { side: "end", size: "default", className: "inset-e-3" },
            { side: "end", size: "lg", className: "inset-e-3.5" },
        ],
    },
);

type IconSvgElement = React.ComponentProps<typeof HugeiconsIcon>["icon"];

export type InputProps = Omit<React.ComponentProps<typeof InputPrimitive>, "size"> &
    VariantProps<typeof inputVariants> & {
        /** Icon rendered at the reading-start edge (left in LTR). Purely decorative. */
        startIcon?: IconSvgElement;
        /**
         * Icon rendered at the reading-end edge. Suppressed automatically when `loading`,
         * `clearable`, or `type="password"` claim that slot — only one end affordance shows
         * at a time.
         */
        endIcon?: IconSvgElement;
        /** Disables the control, shows a spinner in the end slot, sets `aria-busy`. */
        loading?: boolean;
        /** data-success and a checkmark in the end slot. Never combine with `aria-invalid`. */
        success?: boolean;
        /** Adds a clear (×) button in the end slot once the field has a value. Uncontrolled-friendly. */
        clearable?: boolean;
        /** Shown below the field, replacing `errorText` when both are absent. Exits via AnimatePresence. */
        helperText?: React.ReactNode;
        /** Shown below the field instead of `helperText` when present. Implies `aria-invalid`. */
        errorText?: React.ReactNode;
        wrapperClassName?: string;
    };

function InputMessage({
    id,
    tone,
    children,
}: {
    id: string;
    tone: "error" | "helper";
    children: React.ReactNode;
}) {
    return (
        <AnimatePresence>
            {children ? (
                <motion.p
                    key={tone}
                    id={id}
                    role={tone === "error" ? "alert" : undefined}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: duration.fast, ease: ease.inOut }}
                    className={cn(
                        "mbs-1.5 overflow-hidden text-[12px] leading-[1.4]",
                        tone === "error" ? "text-danger" : "text-ink-subtle",
                    )}
                >
                    {children}
                </motion.p>
            ) : null}
        </AnimatePresence>
    );
}

function Input({
    className,
    wrapperClassName,
    type = "text",
    size = "default",
    startIcon,
    endIcon,
    loading = false,
    success = false,
    clearable = false,
    helperText,
    errorText,
    disabled,
    id,
    value,
    defaultValue,
    onValueChange,
    "aria-invalid": ariaInvalid,
    ...props
}: InputProps) {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const messageId = `${inputId}-message`;
    const isInvalid = ariaInvalid ?? Boolean(errorText);
    const isPassword = type === "password";

    const [revealed, setRevealed] = React.useState(false);
    const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue ?? "");
    const currentValue = value ?? uncontrolledValue;
    const hasValue = String(currentValue ?? "").length > 0;

    const showClear = clearable && !loading && !isPassword && hasValue && !disabled;
    const showPasswordToggle = isPassword && !loading;
    const resolvedEndIcon = showPasswordToggle || showClear ? undefined : endIcon;
    const hasEndSlot =
        loading || success || showClear || showPasswordToggle || Boolean(resolvedEndIcon);

    function handleValueChange(
        nextValue: string,
        eventDetails: Parameters<NonNullable<typeof onValueChange>>[1],
    ) {
        if (value === undefined) {
            setUncontrolledValue(nextValue);
        }
        onValueChange?.(nextValue, eventDetails);
    }

    function handleClear(event: React.MouseEvent<HTMLButtonElement>) {
        handleValueChange("", {
            reason: "none",
            event: event.nativeEvent,
            cancel: () => {},
            allowPropagation: () => {},
            isCanceled: false,
            isPropagationAllowed: true,
            trigger: event.currentTarget,
        });
    }

    return (
        <div className={cn("inline-full", wrapperClassName)}>
            <div className="relative">
                {startIcon ? (
                    <span
                        className={cn(iconSlotVariants({ side: "start", size }))}
                        aria-hidden="true"
                    >
                        <HugeiconsIcon icon={startIcon} />
                    </span>
                ) : null}

                <InputPrimitive
                    id={inputId}
                    type={isPassword && revealed ? "text" : type}
                    data-slot="input"
                    data-success={(success && !isInvalid) || undefined}
                    data-loading={loading || undefined}
                    disabled={disabled || loading}
                    aria-busy={loading || undefined}
                    aria-invalid={isInvalid || undefined}
                    aria-describedby={errorText || helperText ? messageId : undefined}
                    value={value}
                    defaultValue={defaultValue}
                    onValueChange={handleValueChange}
                    className={cn(
                        inputVariants({
                            size,
                            hasStartSlot: Boolean(startIcon),
                            hasEndSlot,
                            className,
                        }),
                    )}
                    {...props}
                />

                {hasEndSlot ? (
                    <span className={cn(iconSlotVariants({ side: "end", size }))}>
                        {loading ? (
                            <Tailspin size="16" stroke="2" speed="0.9" color="currentColor" />
                        ) : success && !isInvalid ? (
                            <HugeiconsIcon
                                icon={CheckmarkCircle02Icon}
                                className="text-brand"
                                aria-hidden="true"
                            />
                        ) : showPasswordToggle ? (
                            <button
                                type="button"
                                tabIndex={-1}
                                onClick={() => setRevealed((r) => !r)}
                                className="
                                  pointer-events-auto text-ink-subtle transition-colors duration-160
                                  hover:text-ink
                                "
                                aria-label={revealed ? "Hide password" : "Show password"}
                            >
                                <HugeiconsIcon icon={revealed ? EyeOffIcon : EyeIcon} />
                            </button>
                        ) : showClear ? (
                            <button
                                type="button"
                                tabIndex={-1}
                                onClick={handleClear}
                                className="
                                  pointer-events-auto text-ink-subtle transition-colors duration-160
                                  hover:text-ink
                                "
                                aria-label="Clear"
                            >
                                <HugeiconsIcon icon={CancelCircleIcon} />
                            </button>
                        ) : resolvedEndIcon ? (
                            <HugeiconsIcon icon={resolvedEndIcon} aria-hidden="true" />
                        ) : null}
                    </span>
                ) : null}

                {isInvalid && !hasEndSlot ? (
                    <span
                        className={cn(iconSlotVariants({ side: "end", size }))}
                        aria-hidden="true"
                    >
                        <HugeiconsIcon icon={AlertCircleIcon} className="text-danger" />
                    </span>
                ) : null}
            </div>

            <InputMessage id={messageId} tone={errorText ? "error" : "helper"}>
                {errorText ?? helperText}
            </InputMessage>
        </div>
    );
}

export { Input };
