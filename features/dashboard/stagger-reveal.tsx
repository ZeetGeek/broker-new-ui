"use client";

import type { ReactNode } from "react";

import { motion } from "motion/react";

import { cn } from "@/lib/utils";

import { dashboardHeaderContainer, dashboardHeaderLine } from "./motion";

export type StaggerRevealProps = {
    children: ReactNode;
    className?: string;
};

/**
 * On-load greeting reveal — Motion mount trigger
 * (`initial="hidden"` → `animate="visible"` with staggered lines).
 */
export function StaggerReveal({ children, className }: StaggerRevealProps) {
    return (
        <motion.h1
            className={cn(className)}
            variants={dashboardHeaderContainer}
            initial="hidden"
            animate="visible"
        >
            {children}
        </motion.h1>
    );
}

export type StaggerLineProps = {
    children: ReactNode;
    className?: string;
};

export function StaggerLine({ children, className }: StaggerLineProps) {
    return (
        <motion.span className={cn("block", className)} variants={dashboardHeaderLine}>
            {children}
        </motion.span>
    );
}
