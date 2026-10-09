import type { LucideIcon } from "lucide-react";
import { CalendarClock, Check, CircleCheck, Clock3, RotateCcw, UserRoundX, X } from "lucide-react";

import type { BrokerVisitStatus, TimeRequestStatus, VisitSlot } from "@/features/site-visits/broker/model";
import { isTooSoon } from "@/lib/visits/time";

export type VisitStatusMeta = {
    label: string;
    tone: string;
    bar: string;
    icon: LucideIcon;
    primaryAction?: "outcome" | "reschedule" | "withdraw";
    awaitingOwner?: boolean;
    cancelled?: boolean;
};

export const VISIT_STATUS: Record<BrokerVisitStatus, VisitStatusMeta> = {
    awaiting_owner: { label: "Waiting for owner", tone: "border-pending/25 bg-urgent-soft text-pending", bar: "bg-pending", icon: Clock3, primaryAction: "withdraw", awaitingOwner: true },
    confirmed: { label: "Confirmed", tone: "border-brand/20 bg-brand-soft text-brand-text", bar: "bg-brand", icon: Check, primaryAction: "reschedule" },
    reschedule_pending: { label: "Reschedule asked", tone: "border-pending/25 bg-urgent-soft text-pending", bar: "bg-pending", icon: RotateCcw, primaryAction: "withdraw", awaitingOwner: true },
    cancelled_by_broker: { label: "Cancelled by you", tone: "border-border-warm bg-surface-muted text-ink-muted", bar: "bg-ink-subtle", icon: X, cancelled: true },
    cancelled_by_owner: { label: "Cancelled by owner", tone: "border-danger/20 bg-danger-soft text-danger", bar: "bg-danger", icon: X, cancelled: true },
    completed: { label: "Done", tone: "border-brand/20 bg-brand-soft text-brand-text", bar: "bg-brand", icon: CircleCheck, primaryAction: "outcome" },
    no_show: { label: "Missed", tone: "border-danger/20 bg-danger-soft text-danger", bar: "bg-danger", icon: UserRoundX },
    expired: { label: "Expired", tone: "border-border-warm bg-surface-muted text-ink-muted", bar: "bg-ink-subtle", icon: CalendarClock },
};

export function visitPrimaryAction(status: BrokerVisitStatus, startsAt: string, hasOutcome: boolean): VisitStatusMeta["primaryAction"] {
    if ((status === "confirmed" && new Date(startsAt).getTime() < Date.now()) || (status === "completed" && !hasOutcome)) return "outcome";
    return VISIT_STATUS[status].primaryAction;
}

export function isVisitAwaitingOwner(status: BrokerVisitStatus): boolean {
    return Boolean(VISIT_STATUS[status].awaitingOwner);
}

export function isVisitCancelled(status: BrokerVisitStatus): boolean {
    return Boolean(VISIT_STATUS[status].cancelled);
}

export function visitNeedsOutcome(status: BrokerVisitStatus, startsAt: string, hasOutcome: boolean, now: number): boolean {
    return !hasOutcome && (status === "completed" || (status === "confirmed" && new Date(startsAt).getTime() < now));
}

export const REQUEST_STATUS: Record<TimeRequestStatus, { label: string; tone: string; action: "pending" | "counter" | "accepted" | "retry" | "none"; countsAsReply?: boolean; collapsed?: boolean }> = {
    pending: { label: "Pending", tone: "bg-urgent-soft text-pending", action: "pending", countsAsReply: true },
    counter_offered: { label: "Needs your reply", tone: "bg-danger-soft text-danger", action: "counter", countsAsReply: true },
    accepted: { label: "Accepted", tone: "bg-brand-soft text-brand-text", action: "accepted" },
    declined: { label: "Declined", tone: "bg-surface-muted text-ink-muted", action: "retry" },
    withdrawn: { label: "Withdrawn", tone: "bg-surface-muted text-ink-muted", action: "none", collapsed: true },
    expired: { label: "Expired", tone: "bg-surface-muted text-ink-muted", action: "none", collapsed: true },
};

export const REQUEST_GROUPS: { status: TimeRequestStatus; label: string }[] = [
    { status: "counter_offered", label: "Needs your reply" },
    { status: "pending", label: "Pending" },
    { status: "accepted", label: "Accepted" },
    { status: "declined", label: "Declined" },
];

export function requestCountsAsReply(status: TimeRequestStatus): boolean {
    return Boolean(REQUEST_STATUS[status].countsAsReply);
}

export function requestIsCollapsed(status: TimeRequestStatus): boolean {
    return Boolean(REQUEST_STATUS[status].collapsed);
}

export type SlotVisualState = "available" | "last" | "booked" | "full" | "requested" | "too-soon" | "cancelled";

export function getSlotVisualState(slot: VisitSlot): SlotVisualState {
    if (slot.status === "cancelled") return "cancelled";
    if (slot.bookedVisitId) return "booked";
    if (slot.requestedByMe) return "requested";
    if (slot.status === "full" || slot.bookedCount >= slot.capacity) return "full";
    if (isTooSoon(slot.startsAt)) return "too-soon";
    if (slot.capacity - slot.bookedCount === 1 && slot.capacity > 1) return "last";
    return "available";
}

export function isSlotOpen(slot: VisitSlot): boolean {
    return getSlotVisualState(slot) === "available" || getSlotVisualState(slot) === "last";
}

export function isSlotFull(slot: VisitSlot): boolean {
    return getSlotVisualState(slot) === "full";
}
