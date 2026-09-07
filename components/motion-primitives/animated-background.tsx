"use client";
import { Children, cloneElement, type ReactElement, useId, useState } from "react";

import { AnimatePresence, motion, type Transition } from "motion/react";

import { cn } from "@/lib/utils";

type AnimatedBackgroundChild = ReactElement<{
    "data-id": string;
    className?: string;
    children?: React.ReactNode;
}>;

export type AnimatedBackgroundProps = {
    children: AnimatedBackgroundChild[] | AnimatedBackgroundChild;
    defaultValue?: string;
    onValueChange?: (newActiveId: string | null) => void;
    className?: string;
    transition?: Transition;
    enableHover?: boolean;
};

export function AnimatedBackground({
    children,
    defaultValue,
    onValueChange,
    className,
    transition,
    enableHover = false,
}: AnimatedBackgroundProps) {
    const [activeId, setActiveId] = useState<string | null>(defaultValue ?? null);
    const [prevDefaultValue, setPrevDefaultValue] = useState(defaultValue);
    const uniqueId = useId();

    if (defaultValue !== prevDefaultValue) {
        setPrevDefaultValue(defaultValue);
        if (defaultValue !== undefined) {
            setActiveId(defaultValue);
        }
    }

    const handleSetActiveId = (id: string | null) => {
        setActiveId(id);

        if (onValueChange) {
            onValueChange(id);
        }
    };

    return Children.map(children, (child: AnimatedBackgroundChild, index) => {
        const id = child.props["data-id"];

        const interactionProps = enableHover
            ? {
                  onMouseEnter: () => handleSetActiveId(id),
                  onMouseLeave: () => handleSetActiveId(null),
              }
            : {
                  onClick: () => handleSetActiveId(id),
              };

        return cloneElement(
            child,
            {
                key: index,
                className: cn("relative inline-flex", child.props.className),
                "data-checked": activeId === id ? "true" : "false",
                ...interactionProps,
            },
            <>
                <AnimatePresence initial={false}>
                    {activeId === id && (
                        <motion.div
                            layoutId={`background-${uniqueId}`}
                            className={cn("absolute inset-0", className)}
                            transition={transition}
                            initial={{ opacity: defaultValue ? 1 : 0 }}
                            animate={{
                                opacity: 1,
                            }}
                            exit={{
                                opacity: 0,
                            }}
                        />
                    )}
                </AnimatePresence>
                <div className="z-10">{child.props.children}</div>
            </>,
        );
    });
}
