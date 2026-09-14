"use client";

import { useState } from "react";

import { StickyNote } from "lucide-react";

import { AppModal } from "@/components/shared/app-modal";
import { AppModalFooter } from "@/components/shared/app-modal-footer";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogDescription,
    DialogHeader,
    DialogPopup,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

import { DesignSystemShell } from "@/features/design-system/design-system-shell";
import {
    DIALOG_SIZES,
    DIALOG_USES,
} from "@/features/design-system/theme/dialog-tokens";

function Swatch({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col items-start gap-3 rounded-card bg-surface-muted p-5">
            <p className="eyebrow">{label}</p>
            {children}
        </div>
    );
}

function CompoundDemo() {
    return (
        <Dialog>
            <DialogTrigger
                render={<Button size="default" variant="outline">Open dialog</Button>}
            />
            <DialogPopup className="gap-4">
                <DialogHeader>
                    <DialogTitle>Approve this broker?</DialogTitle>
                    <DialogDescription>
                        They can show &ldquo;3 BHK in Vesu&rdquo; to buyers. You can revoke
                        later.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <DialogClose
                        render={<Button size="default" variant="ghost">Cancel</Button>}
                    />
                    <DialogClose render={<Button size="default">Approve broker</Button>} />
                </div>
            </DialogPopup>
        </Dialog>
    );
}

function AppModalDemo({ size }: { size?: "sm" | "md" | "lg" }) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button size="default" variant="outline" onClick={() => setOpen(true)}>
                Open {size ?? "md"}
            </Button>
            <AppModal
                open={open}
                onOpenChange={setOpen}
                size={size ?? "md"}
                title="Note on Priya Shah"
                description="3 BHK · Vesu"
                footer={
                    <AppModalFooter
                        primaryLabel="Save note"
                        primaryIcon={<StickyNote aria-hidden strokeWidth={1.75} />}
                        onPrimary={() => setOpen(false)}
                        secondaryLabel="Cancel"
                        onSecondary={() => setOpen(false)}
                    />
                }
            >
                <Textarea
                    rows={4}
                    maxLength={500}
                    defaultValue=""
                    placeholder="What did they say?"
                    className="rounded-inner"
                />
            </AppModal>
        </>
    );
}

function DestructiveDemo() {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button size="default" variant="destructive" onClick={() => setOpen(true)}>
                Delete property
            </Button>
            <AppModal
                open={open}
                onOpenChange={setOpen}
                size="sm"
                title="Delete this property?"
                description={
                    <>
                        &ldquo;3 BHK in Vesu&rdquo; will be removed permanently. Brokers
                        currently representing it will be notified.
                    </>
                }
                footer={
                    <div className="flex flex-row flex-wrap items-center justify-end gap-2 inline-full">
                        <Button
                            type="button"
                            variant="ghost"
                            size="default"
                            onClick={() => setOpen(false)}
                            className="inline-auto"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            size="default"
                            onClick={() => setOpen(false)}
                            className="inline-auto"
                        >
                            Delete property
                        </Button>
                    </div>
                }
            >
                <p className="body-sm text-ink-muted">
                    This cannot be undone. Prefer unpublish if you only need to hide it
                    from the pool.
                </p>
            </AppModal>
        </>
    );
}

export function DialogThemePage() {
    return (
        <DesignSystemShell
            eyebrow="Components"
            title="Dialog."
            description="base-ui Dialog + AppModal — one surface, content-height, no dividers. Footer: ghost cancel + default primary, size default, auto width, right-aligned. Motion .t-modal. See docs/DESIGN.md §4.16."
        >
            <div className="space-y-10">
                <section>
                    <h2 className="h4 text-ink">Uses</h2>
                    <p className="body-sm mbs-1 text-ink-muted max-inline-[65ch]">
                        Prefer <code className="body-xs">AppModal</code> in product UI. Reach for
                        the compound Dialog only when the surface is short and has no scroll
                        body.
                    </p>
                    <div className="mbs-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
                        {DIALOG_USES.map((use) => (
                            <Swatch key={use.name} label={use.label}>
                                <div className="flex min-block-14 items-center justify-center inline-full">
                                    {use.name === "compound" ? <CompoundDemo /> : null}
                                    {use.name === "app-modal" ? <AppModalDemo /> : null}
                                    {use.name === "destructive" ? <DestructiveDemo /> : null}
                                </div>
                                <p className="body-xs text-ink-subtle">{use.note}</p>
                            </Swatch>
                        ))}
                    </div>
                </section>

                <section>
                    <h2 className="h4 text-ink">Sizes</h2>
                    <p className="body-sm mbs-1 text-ink-muted max-inline-[65ch]">
                        <code className="body-xs">AppModal</code> sizes. Default is{" "}
                        <code className="body-xs">md</code>. Prefer{" "}
                        <code className="body-xs">sm</code> on phones for confirms and notes.
                    </p>
                    <div className="mbs-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                        {DIALOG_SIZES.map((size) => (
                            <Swatch key={size.name} label={size.label}>
                                <div className="flex min-block-14 items-center justify-center inline-full">
                                    <AppModalDemo size={size.name} />
                                </div>
                                <p className="body-xs text-ink-subtle">{size.note}</p>
                            </Swatch>
                        ))}
                    </div>
                </section>

                <section className="rounded-card bg-brand-deep p-5 md:p-6">
                    <p className="eyebrow text-highlight">Rules</p>
                    <ul className="body-sm mbs-3 list-disc space-y-2 ps-5 text-[#B8CFC4]">
                        <li>
                            Product screens use{" "}
                            <code className="body-xs">AppModal</code> +{" "}
                            <code className="body-xs">AppModalFooter</code>. Same look as compound
                            Dialog — one surface, no header/footer dividers, content-height.
                        </li>
                        <li>
                            Footer: <code className="body-xs">Button</code>{" "}
                            <code className="body-xs">size=&quot;default&quot;</code>, auto width,
                            right-aligned — ghost cancel, default primary.
                        </li>
                        <li>
                            Motion stays on <code className="body-xs">.t-modal</code> +{" "}
                            <code className="body-xs">.t-modal-backdrop</code>.
                        </li>
                        <li>
                            Destructive copy names the record and the consequence. Button verb
                            matches the action — never &ldquo;OK&rdquo; or &ldquo;Yes&rdquo;. See{" "}
                            <code className="body-xs">docs/MESSAGES.md</code>.
                        </li>
                        <li>
                            Do not edit{" "}
                            <code className="body-xs">components/ui/dialog.tsx</code> for one-off
                            styling — pass <code className="body-xs">className</code>, or wrap in{" "}
                            <code className="body-xs">components/shared/</code>.
                        </li>
                    </ul>
                </section>
            </div>
        </DesignSystemShell>
    );
}
