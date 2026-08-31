"use client";

import { SHORTCUTS, type ShortcutDef } from "@/lib/shortcuts";

import { Dialog, DialogHeader, DialogPopup, DialogTitle } from "@/components/ui/dialog";
import { Kbd, KbdGroup } from "@/components/ui/kbd";

export type ShortcutsCheatsheetProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
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

export function ShortcutsCheatsheet({ open, onOpenChange }: ShortcutsCheatsheetProps) {
    const groups = groupShortcuts();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogPopup className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Keyboard shortcuts</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-5">
                    {Array.from(groups.entries()).map(([group, shortcuts]) => (
                        <div key={group} className="flex flex-col gap-2">
                            <p className="eyebrow text-ink-subtle">{group}</p>
                            <div className="flex flex-col gap-1.5">
                                {shortcuts.map((shortcut) => (
                                    <div
                                        key={shortcut.id}
                                        className="flex items-center justify-between gap-4"
                                    >
                                        <span className="body-sm text-ink">{shortcut.label}</span>
                                        <KbdGroup className="gap-0.5">
                                            {shortcut.displayKeys.map((key) => (
                                                <Kbd
                                                    key={key}
                                                    variant="surface"
                                                    className="px-1.5 text-[10px] tracking-normal"
                                                >
                                                    {key}
                                                </Kbd>
                                            ))}
                                        </KbdGroup>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </DialogPopup>
        </Dialog>
    );
}
