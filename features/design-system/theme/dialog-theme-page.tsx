"use client";

import { useState } from "react";

import { MAX_CHARS } from "@/lib/validation/text-limits";

import { AppModal } from "@/components/shared/app-modal";
import { AppModalFooter } from "@/components/shared/app-modal-footer";
import { CharacterCount } from "@/components/shared/character-count";
import { StickyNote } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { DesignSystemShell } from "@/features/design-system/design-system-shell";
import { DIALOG_SIZES, DIALOG_USES } from "@/features/design-system/theme/dialog-tokens";

function Swatch({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col items-start gap-3 rounded-card bg-surface-muted p-5">
            <p className="eyebrow">{label}</p>
            {children}
        </div>
    );
}

function ConfirmationDemo() {
    const [open, setOpen] = useState(false);
    return (
        <>
            <Button size="default" variant="outline" onClick={() => setOpen(true)}>
                Open dialog
            </Button>
            <AppModal
                open={open}
                onOpenChange={setOpen}
                title="Approve this broker?"
                footer={
                    <AppModalFooter
                        secondaryLabel="Cancel"
                        onSecondary={() => setOpen(false)}
                        primaryLabel="Approve broker"
                        onPrimary={() => setOpen(false)}
                    />
                }
            >
                <p className="body-sm text-ink-muted">
                    They can show &ldquo;3 BHK in Andheri West&rdquo; to clients. You can revoke
                    later.
                </p>
            </AppModal>
        </>
    );
}

function AppModalDemo({ size }: { size?: "sm" | "md" | "lg" }) {
    const [open, setOpen] = useState(false);
    const [note, setNote] = useState("");

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
                description="3 BHK · Andheri West"
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
                <div className="flex flex-col gap-2">
                    <Textarea
                        aria-label="Note"
                        rows={4}
                        maxLength={MAX_CHARS.dealNote}
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        placeholder="What did they say?"
                        className="rounded-inner"
                    />
                    <CharacterCount value={note} maxChars={MAX_CHARS.dealNote} />
                </div>
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
                        &ldquo;3 BHK in Andheri West&rdquo; will be removed permanently. Brokers
                        currently representing it will be notified.
                    </>
                }
                footer={
                    <AppModalFooter
                        className="
                      flex flex-row flex-wrap items-center justify-end gap-2 inline-full
                    "
                        secondaryLabel="Cancel"
                        secondaryVariant="ghost"
                        onSecondary={() => setOpen(false)}
                        primaryLabel="Delete property"
                        primaryType="button"
                        primaryVariant="destructive"
                        primarySize="default"
                        onPrimary={() => setOpen(false)}
                    />
                }
            >
                <p className="body-sm text-ink-muted">
                    This cannot be undone. Prefer unpublish if you only need to hide it from the
                    pool.
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
                        Use <code className="body-xs">AppModal</code> for every product modal,
                        including short confirmations. Photo lightboxes keep their specialized
                        viewer.
                    </p>
                    <div className="mbs-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
                        {DIALOG_USES.map((use) => (
                            <Swatch key={use.name} label={use.label}>
                                <div
                                    className="
                                  flex items-center justify-center inline-full min-block-14
                                "
                                >
                                    {use.name === "confirmation" ? <ConfirmationDemo /> : null}
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
                                <div
                                    className="
                                  flex items-center justify-center inline-full min-block-14
                                "
                                >
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
                            Product screens use <code className="body-xs">AppModal</code> +{" "}
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
                            Do not edit <code className="body-xs">components/ui/dialog.tsx</code>{" "}
                            for one-off styling — pass <code className="body-xs">className</code>,
                            or wrap in <code className="body-xs">components/shared/</code>.
                        </li>
                    </ul>
                </section>
            </div>
        </DesignSystemShell>
    );
}
