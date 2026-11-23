"use client";

import type { ComponentType } from "react";

import {
    getShortcuts,
    type ShortcutDef,
    type ShortcutId,
    type ShortcutPortal,
} from "@/lib/shortcuts";

import { AppModalHeader } from "@/components/shared/app-modal-header";
import {
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
    UserRound,
    UserRoundPlus,
    Users,
    Wallet,
} from "@/components/shared/icons";
import { Dialog, DialogPopup } from "@/components/ui/dialog";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { ScrollArea } from "@/components/ui/scroll-area";

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
    saved_properties: Bookmark,
    profile: UserRound,
    settings: Settings,
    add_property: Plus,
    add_contact: Contact,
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

function ShortcutRow({ shortcut }: { shortcut: ShortcutDef }) {
    const Icon = SHORTCUT_ICONS[shortcut.id] ?? Keyboard;
    const displayKeys = useShortcutDisplayKeys(shortcut);

    return (
        <div
            className="
              group flex items-center gap-3 rounded-inner p-2 transition-colors duration-160
              ease-out
              hover:bg-surface-muted
            "
        >
            <span
                className="
                      flex shrink-0 items-center justify-center rounded-control bg-surface-muted
                      text-ink-muted transition-colors duration-160 block-8 inline-8
                      group-hover:bg-surface
                    "
            >
                <Icon aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
            </span>

            <span className="body-sm flex-1 font-medium text-ink">{shortcut.label}</span>

            <KbdGroup className="gap-1">
                {displayKeys.map((key) => (
                    <Kbd
                        key={key}
                        variant="surface"
                        className="justify-center px-1.5 text-[11px] tracking-normal min-inline-6"
                    >
                        {key}
                    </Kbd>
                ))}
            </KbdGroup>
        </div>
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
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogPopup showCloseButton={false} className="gap-0 p-0 max-inline-sm">
                <AppModalHeader title="Keyboard shortcuts" />

                <ScrollArea className="max-block-96">
                    <div className="flex flex-col gap-4 p-4">
                        {Array.from(groups.entries()).map(([group, shortcuts]) => (
                            <div key={group} className="flex flex-col gap-0.5">
                                <p className="eyebrow px-2 pbe-1 text-ink-subtle">{group}</p>
                                {shortcuts.map((shortcut) => (
                                    <ShortcutRow key={shortcut.id} shortcut={shortcut} />
                                ))}
                            </div>
                        ))}
                    </div>
                </ScrollArea>

                <p
                    className="
                      body-xs border-bs border-border-warm px-6 py-3 text-center text-ink-subtle
                    "
                >
                    Press <Kbd variant="surface">?</Kbd> outside a text field to reopen this
                </p>
            </DialogPopup>
        </Dialog>
    );
}
