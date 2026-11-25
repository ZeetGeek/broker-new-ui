"use client";

import type { ComponentType } from "react";

import {
    getShortcuts,
    type ShortcutDef,
    type ShortcutId,
    type ShortcutPortal,
} from "@/lib/shortcuts";
import { cn } from "@/lib/utils";

import { AppModal } from "@/components/shared/app-modal";
import {
    Activity,
    Bell,
    Bookmark,
    Building2,
    CalendarClock,
    CalendarPlus,
    CheckCircle2,
    Command,
    Contact,
    Gift,
    type IconProps,
    Keyboard,
    KeyRound,
    LayoutDashboard,
    Plus,
    Send,
    Settings,
    UserPlus,
    UserRound,
    UserRoundPlus,
    Users,
    Wallet,
} from "@/components/shared/icons";
import { Kbd, KbdGroup } from "@/components/ui/kbd";

import { useShortcutDisplayKeys } from "@/features/shortcuts/use-shortcut-display-keys";

export type ShortcutsCheatsheetProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    portal?: ShortcutPortal;
    /** Shortcuts whose destination is turned off for this portal. */
    hiddenIds?: readonly ShortcutId[];
    /** Non-global shortcuts that are active on the current page. */
    contextIds?: readonly ShortcutId[];
};

const SHORTCUT_ICONS: Partial<Record<ShortcutId, ComponentType<IconProps>>> = {
    shortcuts_cheatsheet: Keyboard,
    dashboard: LayoutDashboard,
    owner_listings: Building2,
    my_deals: Send,
    your_listings: KeyRound,
    pipeline: Users,
    contacts: Contact,
    visits: CalendarClock,
    tasks: CheckCircle2,
    earnings: Wallet,
    referrals: Gift,
    notifications: Bell,
    recent_updates: Activity,
    saved_properties: Bookmark,
    profile: UserRound,
    settings: Settings,
    add_property: Plus,
    add_contact: UserPlus,
    add_owner: UserRoundPlus,
    schedule_visit: CalendarPlus,
    add_task: CheckCircle2,
    form_primary: Command,
    form_submit_another: Plus,
};

function groupShortcuts(
    portal: ShortcutPortal,
    hiddenIds: readonly ShortcutId[],
    contextIds: readonly ShortcutId[],
): Map<string, ShortcutDef[]> {
    const groups = new Map<string, ShortcutDef[]>();
    for (const shortcut of getShortcuts(portal)) {
        if (hiddenIds.includes(shortcut.id)) continue;
        if (shortcut.scope !== "global" && !contextIds.includes(shortcut.id)) continue;
        const list = groups.get(shortcut.group) ?? [];
        list.push(shortcut);
        groups.set(shortcut.group, list);
    }
    return groups;
}

/** tinykeys separates sequence steps with a space ("g d"); chords use "+". */
function isSequence(shortcut: ShortcutDef): boolean {
    return shortcut.keys.trim().includes(" ");
}

function ShortcutRow({ shortcut }: { shortcut: ShortcutDef }) {
    const Icon = SHORTCUT_ICONS[shortcut.id] ?? Keyboard;
    const displayKeys = useShortcutDisplayKeys(shortcut);
    const sequence = isSequence(shortcut);
    // Green marks shortcuts that act on the current page; navigation stays neutral.
    const isPageAction = shortcut.scope !== "global";

    return (
        <li className="flex items-center gap-3 px-2 py-1.5">
            <span
                className={cn(
                    "flex shrink-0 items-center justify-center rounded-control block-8 inline-8",
                    isPageAction
                        ? "bg-brand-soft text-brand-text"
                        : "bg-surface-muted/50 text-ink-muted",
                )}
            >
                <Icon aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
            </span>

            <span className="body-sm flex-1 font-medium text-ink min-inline-0">
                {shortcut.label}
            </span>

            <KbdGroup
                className="shrink-0 gap-1"
                aria-label={`Shortcut: ${displayKeys.join(sequence ? " then " : " + ")}`}
            >
                {displayKeys.map((key, index) => (
                    <span key={`${key}-${index}`} className="contents">
                        {sequence && index > 0 ? (
                            <span aria-hidden className="body-xs px-0.5 text-ink-subtle">
                                then
                            </span>
                        ) : null}
                        <Kbd
                            aria-hidden
                            variant="surface"
                            className="
                              justify-center border-border-warm px-1.5 text-xs tracking-normal
                              text-ink block-6 min-inline-6
                            "
                        >
                            {key}
                        </Kbd>
                    </span>
                ))}
            </KbdGroup>
        </li>
    );
}

export function ShortcutsCheatsheet({
    open,
    onOpenChange,
    portal = "broker",
    hiddenIds = [],
    contextIds = [],
}: ShortcutsCheatsheetProps) {
    const groups = groupShortcuts(portal, hiddenIds, contextIds);

    return (
        <AppModal
            open={open}
            onOpenChange={onOpenChange}
            title="Keyboard shortcuts"
            size="sm"
            padding="md"
            bodyClassName="px-3 py-3"
            footerClassName="border-bs border-(--dialog-divider) pbs-3 pbe-3"
            footer={
                <p className="body-xs text-center text-ink-subtle">
                    Press{" "}
                    <Kbd
                        variant="surface"
                        className="border-border-warm p-0 align-middle text-ink block-5 inline-5"
                    >
                        ?
                    </Kbd>{" "}
                    anytime you are not typing to open this list
                </p>
            }
        >
            <div className="flex flex-col gap-5">
                {Array.from(groups.entries()).map(([group, shortcuts]) => {
                    const headingId = `shortcut-group-${group.toLowerCase().replace(/\s+/g, "-")}`;
                    return (
                        <section key={group} aria-labelledby={headingId}>
                            <h3
                                id={headingId}
                                className="eyebrow sticky inset-bs-0 z-1 bg-surface px-2 py-1.5"
                            >
                                {group}
                            </h3>
                            <ul className="flex flex-col gap-0.5">
                                {shortcuts.map((shortcut) => (
                                    <ShortcutRow key={shortcut.id} shortcut={shortcut} />
                                ))}
                            </ul>
                        </section>
                    );
                })}
            </div>
        </AppModal>
    );
}
