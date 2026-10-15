"use client";

import { useState, type ReactNode } from "react";

import { motion } from "motion/react";

import { TextLoop } from "@/components/motion-primitives/text-loop";
import { DateDisplay } from "@/components/shared/date-display";

import { DigitPopIn } from "./digit-pop-in";
import { dashboardMetaContainer, dashboardMetaItem } from "./motion";
import { StaggerLine, StaggerReveal } from "./stagger-reveal";

const SUMMARY_LOOP_INTERVAL_S = 6.5;

export function countPhrase(count: number, singular: string, plural: string) {
    if (count === 0) {
        return null;
    }

    return (
        <>
            <DigitPopIn value={count} /> {count === 1 ? singular : plural}
        </>
    );
}

function GreetingLoop({ lines }: { lines: ReactNode[] }) {
    const [isPaused, setIsPaused] = useState(false);

    return (
        <span
            aria-live="polite"
            aria-atomic="true"
            className="text-ink-muted"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            <TextLoop interval={SUMMARY_LOOP_INTERVAL_S} trigger={!isPaused}>
                {lines.map((line, index) => (
                    <span key={index}>{line}</span>
                ))}
            </TextLoop>
        </span>
    );
}

export function DashboardMetaItem({ children }: { children: ReactNode }) {
    return <motion.div variants={dashboardMetaItem}>{children}</motion.div>;
}

export function DashboardMetaDivider() {
    return (
        <motion.span
            aria-hidden
            variants={dashboardMetaItem}
            className="hidden self-center bg-border-warm block-3.5 inline-px sm:block"
        />
    );
}

/**
 * Shared overview header chrome for both portals — date + rotating summary,
 * then a meta row (left) and primary actions (right).
 */
export function DashboardPageHeader({
    now,
    greetingLines,
    meta,
    actions,
}: {
    now: Date;
    greetingLines: ReactNode[];
    meta: ReactNode;
    actions: ReactNode;
}) {
    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-4">
                <StaggerReveal className="h1 min-inline-0">
                    <StaggerLine>
                        <DateDisplay date={now} variant="weekday" className="text-ink" />
                        <span className="text-ink">.</span> <GreetingLoop lines={greetingLines} />
                    </StaggerLine>
                </StaggerReveal>
            </div>

            <motion.div
                variants={dashboardMetaContainer}
                initial="hidden"
                animate="visible"
                className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2"
            >
                <div className="-mbe-3 flex flex-wrap items-center gap-x-3 gap-y-2">{meta}</div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <motion.div
                        className="ms-auto flex shrink-0 items-center gap-3"
                        variants={dashboardMetaItem}
                    >
                        {actions}
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
}
