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

import {
    copyInputTypeMetrics,
    runClearDissolve,
    syncClearHasValue,
} from "@/lib/motion/clear-dissolve";
import { clearInputError, shakeInput } from "@/lib/motion/shake-input";
import { swapText } from "@/lib/motion/swap-text";
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
      aria-invalid:border-danger-mid
      aria-invalid:hover:border-danger-mid
      aria-invalid:focus-visible:ring-danger/20
      data-loading:pointer-events-none
      data-success:border-success-mid
      data-success:hover:border-success-mid
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
    `pointer-events-none absolute inset-y-0 z-10 flex items-center text-ink-subtle`,
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
        /** Shown below the field, replacing `errorText` when both are absent. Swaps in place via t-text-swap. */
        helperText?: React.ReactNode;
        /** Shown below the field instead of `helperText` when present. Implies `aria-invalid`. */
        errorText?: React.ReactNode;
        wrapperClassName?: string;
    };

function messageAsText(children: React.ReactNode): string {
    if (children == null || typeof children === "boolean") {
        return "";
    }
    if (typeof children === "string" || typeof children === "number") {
        return String(children);
    }
    return "";
}

function InputMessage({
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
                "t-text-swap mbs-1.5 text-[12px] leading-[1.4]",
                tone === "error"
                    ? "text-danger-mid"
                    : tone === "success"
                      ? "text-success-mid"
                      : "text-ink-subtle",
                shimmer && "t-shimmer",
            )}
        />
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
    placeholder,
    "aria-invalid": ariaInvalid,
    ...props
}: InputProps) {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const messageId = `${inputId}-message`;
    const isInvalid = ariaInvalid ?? Boolean(errorText);
    const isPassword = type === "password";

    const wrapRef = React.useRef<HTMLDivElement>(null);
    const fieldRef = React.useRef<HTMLDivElement>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const mirrorRef = React.useRef<HTMLDivElement>(null);
    const placeholderRef = React.useRef<HTMLDivElement>(null);
    const glowRef = React.useRef<HTMLDivElement>(null);
    const wasInvalid = React.useRef(false);
    const [revealed, setRevealed] = React.useState(false);
    const [isClearing, setIsClearing] = React.useState(false);
    const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue ?? "");
    const currentValue = value ?? uncontrolledValue;
    const hasValue = String(currentValue ?? "").length > 0;

    const showClear = clearable && !loading && !isPassword && (hasValue || isClearing) && !disabled;
    const showPasswordToggle = isPassword && !loading;
    const showStatusSwap = loading || (success && !isInvalid);
    const resolvedEndIcon = showPasswordToggle || showClear ? undefined : endIcon;
    const hasEndSlot =
        showStatusSwap || showClear || showPasswordToggle || Boolean(resolvedEndIcon);

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
        wasInvalid.current = Boolean(isInvalid);
    }, [isInvalid]);

    React.useLayoutEffect(() => {
        const field = fieldRef.current;
        const input = inputRef.current;
        const mirror = mirrorRef.current;
        const placeholderLayer = placeholderRef.current;
        if (!clearable || !field || !input || !mirror || !placeholderLayer) {
            return;
        }
        copyInputTypeMetrics(input, mirror, placeholderLayer);
        syncClearHasValue(field, hasValue);
    }, [clearable, hasValue, size, startIcon, hasEndSlot]);

    function handleValueChange(
        nextValue: string,
        eventDetails: Parameters<NonNullable<typeof onValueChange>>[1],
    ) {
        if (value === undefined) {
            setUncontrolledValue(nextValue);
        }
        onValueChange?.(nextValue, eventDetails);
    }

    function emptyValueDetails(
        event: React.MouseEvent<HTMLButtonElement>,
    ): Parameters<NonNullable<typeof onValueChange>>[1] {
        return {
            reason: "none",
            event: event.nativeEvent,
            cancel: () => {},
            allowPropagation: () => {},
            isCanceled: false,
            isPropagationAllowed: true,
            trigger: event.currentTarget,
        };
    }

    function handleClear(event: React.MouseEvent<HTMLButtonElement>) {
        const field = fieldRef.current;
        const input = inputRef.current;
        const mirror = mirrorRef.current;
        const placeholderLayer = placeholderRef.current;
        const glow = glowRef.current;
        if (!field || !input || !mirror || !placeholderLayer || !glow || !input.value) {
            handleValueChange("", emptyValueDetails(event));
            return;
        }
        setIsClearing(true);
        runClearDissolve({
            wrap: field,
            input,
            mirror,
            placeholder: placeholderLayer,
            glow,
            onClear: () => handleValueChange("", emptyValueDetails(event)),
            onDone: () => setIsClearing(false),
        });
    }

    return (
        <div ref={wrapRef} className={cn("t-input-wrap inline-full", wrapperClassName)}>
            <div ref={fieldRef} className={cn("relative", clearable && "t-clear")}>
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
                    ref={inputRef}
                    type={isPassword && revealed ? "text" : type}
                    data-slot="input"
                    data-success={(success && !isInvalid) || undefined}
                    data-loading={loading || undefined}
                    disabled={disabled || loading}
                    aria-busy={loading || undefined}
                    aria-invalid={isInvalid || undefined}
                    aria-describedby={errorText || helperText ? messageId : undefined}
                    placeholder={placeholder}
                    value={value}
                    defaultValue={defaultValue}
                    onValueChange={handleValueChange}
                    className={cn(
                        "t-input",
                        inputVariants({
                            size,
                            hasStartSlot: Boolean(startIcon),
                            hasEndSlot,
                            className,
                        }),
                    )}
                    {...props}
                />

                {clearable ? (
                    <>
                        <div
                            ref={mirrorRef}
                            className="t-clear-mirror text-ink"
                            aria-hidden="true"
                        />
                        <div
                            ref={placeholderRef}
                            className="t-clear-placeholder text-ink-subtle"
                            aria-hidden="true"
                        >
                            {placeholder}
                        </div>
                        <div ref={glowRef} className="t-clear-glow" aria-hidden="true" />
                    </>
                ) : null}

                {hasEndSlot ? (
                    <span className={cn(iconSlotVariants({ side: "end", size }))}>
                        {showStatusSwap ? (
                            <span className="t-icon-swap" data-state={loading ? "a" : "b"}>
                                <span className="t-icon" data-icon="a">
                                    <Tailspin
                                        size="16"
                                        stroke="2"
                                        speed="0.9"
                                        color="currentColor"
                                    />
                                </span>
                                <span className="t-icon" data-icon="b">
                                    <HugeiconsIcon
                                        icon={CheckmarkCircle02Icon}
                                        className="text-success-mid"
                                        aria-hidden="true"
                                    />
                                </span>
                            </span>
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
                                <span className="t-icon-swap" data-state={revealed ? "b" : "a"}>
                                    <span className="t-icon" data-icon="a">
                                        <HugeiconsIcon icon={EyeIcon} />
                                    </span>
                                    <span className="t-icon" data-icon="b">
                                        <HugeiconsIcon icon={EyeOffIcon} />
                                    </span>
                                </span>
                            </button>
                        ) : showClear ? (
                            <button
                                type="button"
                                tabIndex={-1}
                                onClick={handleClear}
                                onPointerDown={(event) => {
                                    if (document.activeElement === inputRef.current) {
                                        event.preventDefault();
                                    }
                                }}
                                className="
                                  t-clear-btn pointer-events-auto text-ink-subtle transition-colors
                                  duration-160
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
                        <HugeiconsIcon icon={AlertCircleIcon} className="text-danger-mid" />
                    </span>
                ) : null}
            </div>

            <InputMessage
                id={messageId}
                tone={errorText ? "error" : success && !isInvalid ? "success" : "helper"}
                shimmer={Boolean(loading && helperText && !errorText)}
            >
                {errorText ?? helperText}
            </InputMessage>
        </div>
    );
}

export { Input };
