"use client";

import type { ComponentType } from "react";

import {
    Bell,
    Building2,
    CalendarClock,
    Contact,
    Gift,
    Keyboard,
    KeyRound,
    LayoutDashboard,
    LogOut,
    type LucideProps,
    Send,
    Settings,
    UserRound,
    Users,
} from "lucide-react";

import { type ShortcutDef, type ShortcutId,SHORTCUTS } from "@/lib/shortcuts";
import { cn } from "@/lib/utils";

import { Dialog, DialogHeader, DialogPopup, DialogTitle } from "@/components/ui/dialog";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { ScrollArea } from "@/components/ui/scroll-area";

export type ShortcutsCheatsheetProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

const SHORTCUT_ICONS: Record<ShortcutId, ComponentType<LucideProps>> = {
    shortcuts_cheatsheet: Keyboard,
    dashboard: LayoutDashboard,
    owner_listings: Building2,
    my_deals: Send,
    your_listings: KeyRound,
    pipeline: Users,
    contacts: Contact,
    visits: CalendarClock,
    referrals: Gift,
    notifications: Bell,
    profile: UserRound,
    settings: Settings,
    logout: LogOut,
};

function groupShortcuts(): Map<string, ShortcutDef[]> {
    const groups = new Map<string, ShortcutDef[]>();
    for (const shortcut of SHORTCUTS) {
        const list = groups.get(shortcut.group) ?? [];
        list.push(shortcut);
        groups.set(shortcut.group, list);
    }
    return groups;
}

function ShortcutRow({ shortcut }: { shortcut: ShortcutDef }) {
    const Icon = SHORTCUT_ICONS[shortcut.id];
    const destructive = shortcut.id === "logout";

    return (
        <div
            className="
              group flex items-center gap-3 rounded-inner p-2 transition-colors duration-160
              ease-out
              hover:bg-surface-muted
            "
        >
            <span
                className={cn(
                    `
                      flex shrink-0 items-center justify-center rounded-control bg-surface-muted
                      text-ink-muted transition-colors duration-160 block-8 inline-8
                      group-hover:bg-surface
                    `,
                    destructive && "text-danger",
                )}
            >
                <Icon aria-hidden className="block-4 inline-4" strokeWidth={1.75} />
            </span>

            <span className={cn("body-sm flex-1 font-medium text-ink", destructive && "text-danger")}>
                {shortcut.label}
            </span>

            <KbdGroup className="gap-1">
                {shortcut.displayKeys.map((key) => (
                    <Kbd
                        key={key}
                        variant="surface"
                        className={cn(
                            "justify-center px-1.5 text-[11px] tracking-normal min-inline-6",
                            destructive && "border-danger/25 text-danger",
                        )}
                    >
                        {key}
                    </Kbd>
                ))}
            </KbdGroup>
        </div>
    );
}

export function ShortcutsCheatsheet({ open, onOpenChange }: ShortcutsCheatsheetProps) {
    const groups = groupShortcuts();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogPopup className="gap-0 p-0 max-inline-sm">
                <DialogHeader
                    className="
                      flex-row items-center gap-3 border-be border-border-warm px-6 py-5 text-start
                    "
                >
                    <span
                        className="
                          flex shrink-0 items-center justify-center rounded-control bg-brand-soft
                          text-brand block-10 inline-10
                        "
                    >
                        <Keyboard aria-hidden className="block-5 inline-5" strokeWidth={1.75} />
                    </span>
                    <div className="flex flex-col gap-0.5">
                        <DialogTitle>Keyboard shortcuts</DialogTitle>
                        <p className="body-xs text-ink-muted">Fast paths for desktop work</p>
                    </div>
                </DialogHeader>

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
                    Press <Kbd variant="surface">?</Kbd> anytime to reopen this
                </p>
            </DialogPopup>
        </Dialog>
    );
}
