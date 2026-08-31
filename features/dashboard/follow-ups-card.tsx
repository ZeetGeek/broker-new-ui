"use client";

import { useRef, useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";

import { MessageCircle, Phone } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { duration, ease } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";

import { CardLabel } from "./card-label";
import { DASHBOARD_CARD_SHELL } from "./card-shell";
import type { FollowUp, FollowUpDue, FollowUpsData } from "./mock-data";
import { TextLinkButton } from "./text-link-button";

const FOLLOW_UPS_INFO =
    "Untimed tasks to chase — tick them done here, or jump straight into WhatsApp.";

const MAX_ROWS = 4;
const UNDO_MS = 5000;
/** Brief beat so strike-through reads before the row collapses. */
const STRIKE_HOLD_MS = duration.instant * 1000;

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
    /** Persist completion. Animation starts immediately — do not await this. */
    onComplete?: (id: string) => Promise<void>;
    className?: string;
};

async function defaultComplete(_id: string) {
    await new Promise((resolve) => setTimeout(resolve, 300));
}

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
                <MessageCircle aria-hidden className="block-4.5 inline-4.5" strokeWidth={1.75} />
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
            <Phone aria-hidden className="block-4.5 inline-4.5" strokeWidth={1.75} />
        </a>
    );
}

function FollowUpRow({
    item,
    completing,
    onMarkDone,
}: {
    item: FollowUp;
    completing: boolean;
    onMarkDone: (id: string) => void;
}) {
    return (
        <motion.li
            layout
            variants={rowVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
                "flex items-start gap-3 overflow-hidden py-3",
                completing && "opacity-40",
            )}
        >
            <button
                type="button"
                aria-label={`Mark ${item.title} as done`}
                className={cn(
                    `
                      mbs-0.5 flex shrink-0 items-center justify-center rounded-[5px] border-[1.5px]
                      border-brand bg-transparent outline-none
                      hover:border-brand-text
                      focus-visible:ring-2 focus-visible:ring-ring
                    `,
                    "relative block-4.25 inline-4.25 after:absolute after:-inset-3",
                )}
                onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onMarkDone(item.id);
                }}
            />

            <Link
                href={item.href}
                className="
                  flex flex-1 items-start gap-2.5 rounded-inner outline-none min-inline-0
                  focus-visible:ring-2 focus-visible:ring-ring
                "
            >
                <div className="flex-1 min-inline-0">
                    <p
                        className={cn(
                            "body truncate font-semibold text-ink",
                            completing && "line-through",
                        )}
                    >
                        {item.title}
                    </p>
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
        <div
            className="
              flex flex-1 flex-col items-center justify-center gap-4 text-center
              min-block-0 px-1
            "
            aria-live="polite"
        >
            <div className="flex max-w-prose flex-col gap-1.5">
                <h2 className="h5 text-ink">No follow-ups yet</h2>
                <p className="body-sm text-pretty text-ink-muted">
                    Set a reminder to call a client back, and it&apos;ll show here.
                </p>
            </div>

            <TextLinkButton href="/broker/clients">Add a follow-up</TextLinkButton>
        </div>
    );
}

type RemovedEntry = { item: FollowUp; index: number };

export function FollowUpsCard({
    data,
    onComplete = defaultComplete,
    className,
}: FollowUpsCardProps) {
    const [items, setItems] = useState(() => data.items.slice(0, MAX_ROWS));
    const [completingIds, setCompletingIds] = useState<Set<string>>(() => new Set());
    const removedRef = useRef<Map<string, RemovedEntry>>(new Map());

    const overdueCount = items.filter((item) => item.due === "overdue").length;
    const isEmpty = items.length === 0;
    const showFade = items.length >= 3 || data.remainingThisWeek > 0;

    function restoreItem(id: string) {
        const removed = removedRef.current.get(id);
        if (!removed) return;
        removedRef.current.delete(id);
        setCompletingIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
        setItems((prev) => {
            if (prev.some((item) => item.id === id)) return prev;
            const next = [...prev];
            next.splice(Math.min(removed.index, next.length), 0, removed.item);
            return next.slice(0, MAX_ROWS);
        });
    }

    function handleMarkDone(id: string) {
        const index = items.findIndex((item) => item.id === id);
        const target = items[index];
        if (!target || completingIds.has(id)) return;

        setCompletingIds((prev) => new Set(prev).add(id));
        removedRef.current.set(id, { item: target, index });

        window.setTimeout(() => {
            setItems((prev) => prev.filter((item) => item.id !== id));
            setCompletingIds((prev) => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }, STRIKE_HOLD_MS);

        void onComplete(id)
            .then(() => {
                toast(
                    (t) => (
                        <span className="flex items-center gap-3">
                            <span>Marked done</span>
                            <button
                                type="button"
                                className="
                                  font-semibold text-brand underline-offset-2
                                  hover:underline
                                "
                                onClick={() => {
                                    restoreItem(id);
                                    toast.dismiss(t.id);
                                }}
                            >
                                Undo
                            </button>
                        </span>
                    ),
                    { duration: UNDO_MS, id: `followup-done-${id}` },
                );
            })
            .catch(() => {
                restoreItem(id);
                toast.error("Couldn't mark done. Try again.");
            });
    }

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
                            className={cn(
                                "flex flex-col divide-y divide-border-warm/50",
                                showFade && "pbe-7",
                            )}
                            initial="hidden"
                            animate="visible"
                            variants={listVariants}
                        >
                            <AnimatePresence initial={false}>
                                {items.map((item) => (
                                    <FollowUpRow
                                        key={item.id}
                                        item={item}
                                        completing={completingIds.has(item.id)}
                                        onMarkDone={handleMarkDone}
                                    />
                                ))}
                            </AnimatePresence>
                        </motion.ul>
                    </div>

                    <div
                        className="
                          absolute inset-x-0 -inset-be-4 z-10 flex flex-col justify-end block-14
                        "
                    >
                        {showFade ? (
                            <div
                                aria-hidden
                                className={`
                                  pointer-events-none absolute inset-0 bg-linear-to-t from-surface
                                  from-40% via-surface/90 to-transparent
                                `}
                            />
                        ) : null}
                        <div className="relative flex justify-center">
                            <TextLinkButton href="/broker/clients?filter=followups">
                                View all follow-ups
                            </TextLinkButton>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
