"use client";

import Link from "next/link";

import { motion } from "motion/react";

import { duration, ease } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

import { EmptyState } from "@/components/shared/empty-state";
import { BellRing, CallIcon, WhatsAppIcon } from "@/components/shared/icons";
import { ShortcutKbdMessage } from "@/components/shared/shortcut-tooltip";
import { Badge } from "@/components/ui/badge";

import { CardLabel } from "./card-label";
import { DASHBOARD_CARD_SHELL } from "./card-shell";
import type { FollowUp, FollowUpDue, FollowUpsData } from "./mock-data";

const FOLLOW_UPS_INFO =
    "Follow-ups to review. Open a client or contact them directly. Completion is not available here yet.";

const MAX_ROWS = 4;

const DUE_CLASS: Record<FollowUpDue, string> = {
    overdue: "text-urgent",
    today: "text-brand",
    upcoming: "text-ink-muted",
};

const listVariants = {
    visible: {
        transition: { staggerChildren: 0.04 },
    },
};

const rowVariants = {
    hidden: { opacity: 0, y: 4 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: duration.base, ease: ease.out },
    },
    exit: {
        opacity: 0.4,
        height: 0,
        paddingTop: 0,
        paddingBottom: 0,
        marginTop: 0,
        marginBottom: 0,
        borderBottomWidth: 0,
        transition: { duration: duration.tabs, ease: ease.in },
    },
};

export type FollowUpsCardProps = {
    data: FollowUpsData;
    className?: string;
};

function waMeUrl(phoneE164: string) {
    return `https://wa.me/${phoneE164.replace(/\D/g, "")}`;
}

function ChannelAction({ item }: { item: FollowUp }) {
    if (item.channel === "none") return null;

    const className = cn(
        `
          relative inline-flex shrink-0 items-center justify-center rounded-control text-brand
          outline-none
          after:absolute after:-inset-3
          hover:text-brand-text
          focus-visible:ring-2 focus-visible:ring-ring
        `,
        "block-4.5 inline-4.5",
    );

    if (item.channel === "whatsapp") {
        return (
            <a
                href={waMeUrl(item.clientPhone)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`WhatsApp ${item.clientName}`}
                className={className}
                onClick={(event) => event.stopPropagation()}
            >
                <WhatsAppIcon aria-hidden className="block-4.5 inline-4.5" strokeWidth={1.75} />
            </a>
        );
    }

    return (
        <a
            href={`tel:${item.clientPhone}`}
            aria-label={`Call ${item.clientName}`}
            className={className}
            onClick={(event) => event.stopPropagation()}
        >
            <CallIcon aria-hidden className="block-4.5 inline-4.5" strokeWidth={1.75} />
        </a>
    );
}

function FollowUpRow({ item }: { item: FollowUp }) {
    return (
        <motion.li
            layout
            variants={rowVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex items-start gap-3 overflow-hidden py-3"
        >
            <Link
                href={item.href}
                className="
                  flex flex-1 items-start gap-2.5 rounded-inner outline-none min-inline-0
                  focus-visible:ring-2 focus-visible:ring-ring
                "
            >
                <div className="flex-1 min-inline-0">
                    <p className="body truncate font-semibold text-ink">{item.title}</p>
                    <p className="body-sm mbs-0.5 truncate text-ink-muted">{item.context}</p>
                </div>

                <span className={cn("body-sm shrink-0 whitespace-nowrap", DUE_CLASS[item.due])}>
                    {item.dueLabel}
                </span>
            </Link>

            <ChannelAction item={item} />
        </motion.li>
    );
}

function EmptyFollowUps() {
    return (
        <EmptyState
            icon={BellRing}
            heading="No follow-ups yet"
            description="Your scheduled follow-ups will appear here."
        >
            <ShortcutKbdMessage shortcutId="pipeline">to open Pipeline</ShortcutKbdMessage>
        </EmptyState>
    );
}

export function FollowUpsCard({ data, className }: FollowUpsCardProps) {
    const items = data.items.slice(0, MAX_ROWS);
    const overdueCount = data.overdueCount;
    const isEmpty = items.length === 0;

    return (
        <section
            className={cn(DASHBOARD_CARD_SHELL, className)}
            aria-labelledby="follow-ups-card-heading"
        >
            <div className="flex shrink-0 items-center justify-between gap-3">
                <CardLabel info={FOLLOW_UPS_INFO}>
                    <span id="follow-ups-card-heading">Follow-ups</span>
                </CardLabel>
                {overdueCount > 0 ? (
                    <Badge
                        variant="urgent"
                        className="border-0"
                        aria-label={`${overdueCount} overdue follow-ups`}
                    >
                        {overdueCount} overdue
                    </Badge>
                ) : null}
            </div>

            {isEmpty ? (
                <EmptyFollowUps />
            ) : (
                <div className="relative mbs-2 flex-1 min-block-0">
                    <div
                        className="
                          absolute inset-0 scrollbar-none overflow-y-auto overscroll-contain
                          [-ms-overflow-style:none]
                          [&::-webkit-scrollbar]:hidden
                        "
                    >
                        <motion.ul
                            className="flex flex-col"
                            initial="hidden"
                            animate="visible"
                            variants={listVariants}
                        >
                            {items.map((item) => (
                                <FollowUpRow key={item.id} item={item} />
                            ))}
                        </motion.ul>
                    </div>
                </div>
            )}
        </section>
    );
}
