"use client";

import { Download, FileText, X } from "lucide-react";

import {
    Attachment,
    AttachmentAction,
    AttachmentActions,
    AttachmentContent,
    AttachmentDescription,
    AttachmentGroup,
    AttachmentMedia,
    AttachmentTitle,
} from "@/components/ui/attachment";

import { DesignSystemShell } from "@/features/design-system/design-system-shell";
import {
    ATTACHMENT_ORIENTATIONS,
    ATTACHMENT_SIZES,
    ATTACHMENT_STATES,
    ATTACHMENT_USES,
} from "@/features/design-system/theme/attachment-tokens";

function Swatch({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col items-start gap-3 rounded-card bg-surface-muted p-5">
            <p className="eyebrow">{label}</p>
            {children}
        </div>
    );
}

function FileDemo({
    state = "done",
    size = "default",
}: {
    state?: "idle" | "uploading" | "processing" | "error" | "done";
    size?: "default" | "sm" | "xs";
}) {
    const description =
        state === "uploading"
            ? "Uploading · 64%"
            : state === "processing"
              ? "Processing…"
              : state === "error"
                ? "Upload failed. Try again."
                : state === "idle"
                  ? "Drop a file here"
                  : "PDF · 2.4 MB";

    return (
        <Attachment state={state} size={size}>
            <AttachmentMedia>
                <FileText aria-hidden strokeWidth={1.75} />
            </AttachmentMedia>
            <AttachmentContent>
                <AttachmentTitle>sales-agreement.pdf</AttachmentTitle>
                <AttachmentDescription>{description}</AttachmentDescription>
            </AttachmentContent>
            {state !== "idle" ? (
                <AttachmentActions>
                    <AttachmentAction aria-label="Remove sales-agreement.pdf">
                        <X aria-hidden strokeWidth={2} />
                    </AttachmentAction>
                </AttachmentActions>
            ) : null}
        </Attachment>
    );
}

function ImageDemo() {
    return (
        <Attachment orientation="vertical" state="done">
            <AttachmentMedia variant="image">
                {/* eslint-disable-next-line @next/next/no-img-element -- design-system demo only */}
                <img
                    src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=200&h=200&fit=crop"
                    alt=""
                />
            </AttachmentMedia>
            <AttachmentContent>
                <AttachmentTitle>vesu-living.jpg</AttachmentTitle>
                <AttachmentDescription>JPG · 820 KB</AttachmentDescription>
            </AttachmentContent>
            <AttachmentActions>
                <AttachmentAction aria-label="Download vesu-living.jpg">
                    <Download aria-hidden strokeWidth={2} />
                </AttachmentAction>
            </AttachmentActions>
        </Attachment>
    );
}

function GroupDemo() {
    return (
        <AttachmentGroup className="max-inline-full pe-1">
            <FileDemo />
            <Attachment state="done" size="default">
                <AttachmentMedia>
                    <FileText aria-hidden strokeWidth={1.75} />
                </AttachmentMedia>
                <AttachmentContent>
                    <AttachmentTitle>floor-plan.pdf</AttachmentTitle>
                    <AttachmentDescription>PDF · 1.1 MB</AttachmentDescription>
                </AttachmentContent>
                <AttachmentActions>
                    <AttachmentAction aria-label="Remove floor-plan.pdf">
                        <X aria-hidden strokeWidth={2} />
                    </AttachmentAction>
                </AttachmentActions>
            </Attachment>
            <Attachment state="done" size="default">
                <AttachmentMedia>
                    <FileText aria-hidden strokeWidth={1.75} />
                </AttachmentMedia>
                <AttachmentContent>
                    <AttachmentTitle>rera-certificate.pdf</AttachmentTitle>
                    <AttachmentDescription>PDF · 640 KB</AttachmentDescription>
                </AttachmentContent>
                <AttachmentActions>
                    <AttachmentAction aria-label="Remove rera-certificate.pdf">
                        <X aria-hidden strokeWidth={2} />
                    </AttachmentAction>
                </AttachmentActions>
            </Attachment>
        </AttachmentGroup>
    );
}

export function AttachmentThemePage() {
    return (
        <DesignSystemShell
            eyebrow="Components"
            title="Attachment."
            description="shadcn Attachment — file and image chips with upload state, sizes, and a snap-scrolling group. Themed to surface / border-warm / ink / danger. See docs/DESIGN.md §3–4."
        >
            <div className="space-y-10">
                <section>
                    <h2 className="h4 text-ink">Uses</h2>
                    <p className="body-sm mbs-1 text-ink-muted max-inline-[65ch]">
                        Composer previews, chat message files, and upload lists. Compose
                        media + content + actions — do not hand-roll a second chip.
                    </p>
                    <div className="mbs-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {ATTACHMENT_USES.map((use) => (
                            <Swatch key={use.name} label={use.label}>
                                <div className="flex min-block-16 items-center justify-center inline-full">
                                    {use.name === "file" ? <FileDemo /> : null}
                                    {use.name === "image" ? <ImageDemo /> : null}
                                    {use.name === "group" ? (
                                        <div className="max-inline-full overflow-hidden">
                                            <GroupDemo />
                                        </div>
                                    ) : null}
                                    {use.name === "states" ? (
                                        <FileDemo state="uploading" />
                                    ) : null}
                                </div>
                                <p className="body-xs text-ink-subtle">{use.note}</p>
                            </Swatch>
                        ))}
                    </div>
                </section>

                <section>
                    <h2 className="h4 text-ink">States</h2>
                    <p className="body-sm mbs-1 text-ink-muted max-inline-[65ch]">
                        Wire <code className="body-xs">state</code> to the real upload
                        lifecycle. Error copy must live in the description — colour alone is
                        not enough.
                    </p>
                    <div className="mbs-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {ATTACHMENT_STATES.map((item) => (
                            <Swatch key={item.name} label={item.label}>
                                <div className="flex min-block-14 items-center justify-center inline-full">
                                    <FileDemo state={item.name} />
                                </div>
                                <p className="body-xs text-ink-subtle">{item.note}</p>
                            </Swatch>
                        ))}
                    </div>
                </section>

                <section>
                    <h2 className="h4 text-ink">Sizes</h2>
                    <p className="body-sm mbs-1 text-ink-muted max-inline-[65ch]">
                        Three steps. Prefer default in chat; use xs only when space is
                        genuinely tight.
                    </p>
                    <div className="mbs-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                        {ATTACHMENT_SIZES.map((item) => (
                            <Swatch key={item.name} label={item.label}>
                                <div className="flex min-block-14 items-center justify-center inline-full">
                                    <FileDemo size={item.name} />
                                </div>
                                <p className="body-xs text-ink-subtle">{item.note}</p>
                            </Swatch>
                        ))}
                    </div>
                </section>

                <section>
                    <h2 className="h4 text-ink">Orientation</h2>
                    <p className="body-sm mbs-1 text-ink-muted max-inline-[65ch]">
                        Horizontal for documents. Vertical when the media is the point —
                        usually with <code className="body-xs">variant=&quot;image&quot;</code>.
                    </p>
                    <div className="mbs-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {ATTACHMENT_ORIENTATIONS.map((item) => (
                            <Swatch key={item.name} label={item.label}>
                                <div className="flex min-block-24 items-center justify-center inline-full">
                                    {item.name === "horizontal" ? (
                                        <FileDemo />
                                    ) : (
                                        <ImageDemo />
                                    )}
                                </div>
                                <p className="body-xs text-ink-subtle">{item.note}</p>
                            </Swatch>
                        ))}
                    </div>
                </section>

                <section className="rounded-card bg-brand-deep p-5 md:p-6">
                    <p className="eyebrow text-highlight">Rules</p>
                    <ul className="body-sm mbs-3 list-disc space-y-2 ps-5 text-[#B8CFC4]">
                        <li>
                            Use <code className="body-xs">Attachment</code> from{" "}
                            <code className="body-xs">components/ui/attachment.tsx</code>. Do
                            not invent a second file chip for chat or uploads.
                        </li>
                        <li>
                            Surface on canvas: white <code className="body-xs">surface</code>,{" "}
                            <code className="body-xs">border-warm</code>,{" "}
                            <code className="body-xs">rounded-card</code>. Error uses{" "}
                            <code className="body-xs">danger</code> — never decorative orange.
                        </li>
                        <li>
                            Uploading / processing shimmer the title via the built-in{" "}
                            <code className="body-xs">shimmer</code> utility. Keep the
                            progress or failure reason in the description.
                        </li>
                        <li>
                            Icon-only actions need an{" "}
                            <code className="body-xs">aria-label</code> that names the file.
                        </li>
                        <li>
                            Do not edit{" "}
                            <code className="body-xs">components/ui/attachment.tsx</code> for
                            one-off styling — pass <code className="body-xs">className</code>
                            , or wrap in <code className="body-xs">components/shared/</code>.
                        </li>
                    </ul>
                </section>
            </div>
        </DesignSystemShell>
    );
}
