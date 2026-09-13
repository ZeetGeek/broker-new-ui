"use client";

import { useEffect, useRef, useState } from "react";

import { Plus, UserPlus, UserRoundPlus, X } from "lucide-react";

export function ContactsSpeedDial({
    onAddBuyer,
    onAddOwner,
}: {
    onAddBuyer: () => void;
    onAddOwner: () => void;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const outside = (event: PointerEvent) => {
            if (!ref.current?.contains(event.target as Node)) setOpen(false);
        };
        const escape = (event: KeyboardEvent) => {
            if (event.key === "Escape") setOpen(false);
        };
        document.addEventListener("pointerdown", outside);
        document.addEventListener("keydown", escape);
        return () => {
            document.removeEventListener("pointerdown", outside);
            document.removeEventListener("keydown", escape);
        };
    }, []);

    const choose = (action: () => void) => {
        setOpen(false);
        action();
    };

    return (
        <div
            className="
          fixed inset-e-8 inset-be-[calc(5.75rem+env(safe-area-inset-bottom))] z-30 block-40
          inline-56
          md:inset-e-10 md:inset-be-10
        "
        >
            <div
                ref={ref}
                className="
                  contacts-speed-dial t-morph absolute inset-e-0 inset-be-0 bg-brand text-surface
                  shadow-lg
                "
                data-open={open}
            >
                <div className="t-morph-menu flex flex-col justify-between gap-2 p-3">
                    <div className="flex items-center justify-between px-1">
                        <span className="body-sm font-semibold text-surface">Add contact</span>
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            aria-label="Close add menu"
                            className="
                              grid place-items-center rounded-control text-surface/80 block-8
                              inline-8
                              hover:bg-surface/10 hover:text-surface
                              focus-visible:ring-2 focus-visible:ring-surface/70
                            "
                        >
                            <X aria-hidden className="block-4 inline-4" />
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={() => choose(onAddBuyer)}
                        className="
                          body-sm flex items-center gap-3 rounded-control bg-surface px-3
                          font-semibold text-ink block-11
                          hover:bg-surface-muted
                          focus-visible:ring-2 focus-visible:ring-surface
                        "
                    >
                        <UserPlus aria-hidden className="text-brand block-4.5 inline-4.5" />
                        Add buyer
                    </button>
                    <button
                        type="button"
                        onClick={() => choose(onAddOwner)}
                        className="
                          body-sm flex items-center gap-3 rounded-control bg-surface px-3
                          font-semibold text-ink block-11
                          hover:bg-surface-muted
                          focus-visible:ring-2 focus-visible:ring-surface
                        "
                    >
                        <UserRoundPlus aria-hidden className="text-brand block-4.5 inline-4.5" />
                        Add owner
                    </button>
                </div>
                <button
                    type="button"
                    className="t-morph-plus"
                    aria-expanded={open}
                    aria-label="Add contact"
                    onClick={(event) => {
                        event.stopPropagation();
                        setOpen((current) => !current);
                    }}
                >
                    <Plus aria-hidden className="block-6 inline-6" />
                </button>
            </div>
        </div>
    );
}
