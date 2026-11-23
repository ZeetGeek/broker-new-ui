"use client";

import { useEffect, useRef, useState } from "react";
import toast, { useToasterStore } from "react-hot-toast";

import {
    AppToast,
    type AppToastContent,
    AppToaster,
    showAppToast,
} from "@/components/shared/app-toast";
import { ChevronRight, Layers, Play } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";

import { DesignSystemShell } from "@/features/design-system/design-system-shell";

import { TOAST_EXAMPLES, TOAST_GROUPS, TOAST_VARIANTS, type ToastExample } from "./toast-examples";

import styles from "./toast-theme-page.module.css";

const TOASTER_ID = "design-system-toast-preview";

function ToastSpecimen({
    example,
    onShow,
    onAction,
}: {
    example: ToastExample;
    onShow: (example: ToastExample) => void;
    onAction: (example: ToastExample) => void;
}) {
    const [dismissed, setDismissed] = useState(false);
    return (
        <div>
            <div className={styles.variantHeader}>
                <h3 className="body font-semibold">
                    {TOAST_VARIANTS.find((item) => item.variant === example.variant)?.label}
                </h3>
                <Button variant="ghost" size="sm" onClick={() => onShow(example)}>
                    Preview <Play aria-hidden="true" />
                </Button>
            </div>
            {dismissed ? (
                <div className={styles.restore}>
                    <Button variant="outline" onClick={() => setDismissed(false)}>
                        Restore example
                    </Button>
                </div>
            ) : (
                <AppToast
                    {...example}
                    action={
                        example.actionLabel
                            ? { label: example.actionLabel, onClick: () => onAction(example) }
                            : undefined
                    }
                    onDismiss={() => setDismissed(true)}
                />
            )}
            <p className={styles.variantNote}>
                {TOAST_VARIANTS.find((item) => item.variant === example.variant)?.note}
            </p>
        </div>
    );
}

export function ToastThemePage() {
    const [selected, setSelected] = useState(TOAST_EXAMPLES[0]);
    const [group, setGroup] = useState<(typeof TOAST_GROUPS)[number]>("Properties");
    const [dismissed, setDismissed] = useState(false);
    const [feedback, setFeedback] = useState(
        "Interactive examples only. No live records are changed.",
    );
    const flowTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const { toasts } = useToasterStore(undefined, TOASTER_ID);
    const activeCount = toasts.filter((item) => item.visible).length;

    useEffect(
        () => () => {
            if (flowTimer.current) clearTimeout(flowTimer.current);
            toast.remove(undefined, TOASTER_ID);
        },
        [],
    );

    function limitStack() {
        toasts
            .filter((item) => item.visible)
            .slice(2)
            .forEach((item) => toast.remove(item.id, TOASTER_ID));
    }

    function runAction(example: ToastExample) {
        if (example.actionLabel === "Try again") {
            runSaveFlow(
                false,
                example.id === "upload-error"
                    ? "photo"
                    : example.id === "offline"
                      ? "connection"
                      : "property",
            );
        } else if (example.actionLabel === "Undo") {
            limitStack();
            showAppToast(
                {
                    variant: "success",
                    title:
                        example.id === "task-completed"
                            ? "Task marked incomplete"
                            : "Property restored",
                    description: "Preview only. No live record was changed.",
                },
                { toasterId: TOASTER_ID, id: "demo-undo" },
            );
            setFeedback("Undo completed in this preview.");
        } else {
            setFeedback(
                `Preview action: ${example.actionLabel}. In the app, this opens the related record or form.`,
            );
        }
    }

    function contentFor(example: ToastExample): AppToastContent {
        return {
            ...example,
            action: example.actionLabel
                ? { label: example.actionLabel, onClick: () => runAction(example) }
                : undefined,
        };
    }

    function showExample(example: ToastExample) {
        setSelected(example);
        setDismissed(false);
        limitStack();
        showAppToast(contentFor(example), { toasterId: TOASTER_ID, id: `example-${example.id}` });
        setFeedback(`${example.title} — live preview shown at the bottom of the screen.`);
    }

    function clearPreviews() {
        if (flowTimer.current) clearTimeout(flowTimer.current);
        flowTimer.current = null;
        toast.dismiss(undefined, TOASTER_ID);
        setFeedback("Live previews cleared.");
    }

    function runSaveFlow(fail = false, kind: "property" | "photo" | "connection" = "property") {
        if (flowTimer.current) clearTimeout(flowTimer.current);
        limitStack();
        const id = "demo-save-flow";
        showAppToast(
            {
                variant: "loading",
                title:
                    kind === "photo"
                        ? "Uploading your photo…"
                        : kind === "connection"
                          ? "Checking your connection…"
                          : "Saving your property…",
                description: "Please keep this page open.",
            },
            { toasterId: TOASTER_ID, id },
        );
        setFeedback("Simulating an operation. The loading toast will update in place.");
        flowTimer.current = setTimeout(() => {
            const next: ToastExample = fail
                ? TOAST_EXAMPLES.find((item) => item.id === "save-error")!
                : kind === "photo"
                  ? {
                        id: "photo-uploaded",
                        group: "System feedback",
                        variant: "success",
                        title: "Photo uploaded",
                        description: "Your photo is ready.",
                    }
                  : kind === "connection"
                    ? {
                          id: "back-online",
                          group: "System feedback",
                          variant: "success",
                          title: "You're back online",
                          description: "You can continue where you left off.",
                      }
                    : TOAST_EXAMPLES[0];
            showAppToast(contentFor(next), { toasterId: TOASTER_ID, id });
            setFeedback(
                fail
                    ? "Save failed in this demo. Try again replays the loading state."
                    : "Demo completed. The same toast updated to success.",
            );
            flowTimer.current = null;
        }, 1800);
    }

    function showStack() {
        clearPreviews();
        toast.remove(undefined, TOASTER_ID);
        ["property-updated", "client-added", "task-reminder"].forEach((id) => {
            const example = TOAST_EXAMPLES.find((item) => item.id === id)!;
            showAppToast(contentFor(example), { toasterId: TOASTER_ID, id: `stack-${id}` });
        });
        setFeedback(
            "Three notifications, newest at the bottom. Dismiss any card to see the stack settle.",
        );
    }

    return (
        <DesignSystemShell
            eyebrow="Components"
            title="Toasts."
            description="Clear feedback, right when it matters. One shared design for confirmations, reminders, and the moments in between."
        >
            <AppToaster toasterId={TOASTER_ID} />
            <section className={styles.playground} aria-labelledby="toast-playground-heading">
                <div className={styles.controls}>
                    <h2 id="toast-playground-heading" className="h3 text-ink">
                        Small message.
                        <br />
                        Clear next step.
                    </h2>
                    <p className="body mbs-3 text-ink-muted">
                        Try the new toast in context. Dismiss it, follow an action, or watch a save
                        move from loading to done.
                    </p>
                    <div className={styles.buttons}>
                        <Button size="md" onClick={() => showExample(selected)}>
                            <Play aria-hidden="true" /> Show toast
                        </Button>
                        <Button size="md" variant="outline" onClick={() => runSaveFlow()}>
                            Play save flow
                        </Button>
                    </div>
                    <div className={styles.buttons}>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearPreviews}
                            disabled={activeCount === 0}
                        >
                            Clear live toasts{activeCount > 0 ? ` (${activeCount})` : ""}
                        </Button>
                    </div>
                </div>
                <div className={styles.stage}>
                    <div className={styles.stageHeader}>
                        <span>Component preview</span>
                        <span>
                            {selected.variant.charAt(0).toUpperCase() + selected.variant.slice(1)}
                        </span>
                    </div>
                    <div className={styles.stageBody}>
                        {dismissed ? (
                            <Button variant="outline" onClick={() => setDismissed(false)}>
                                Restore preview
                            </Button>
                        ) : (
                            <AppToast
                                {...contentFor(selected)}
                                onDismiss={() => {
                                    setDismissed(true);
                                    setFeedback("Preview dismissed. Restore it to try again.");
                                }}
                                className={styles.specimen}
                            />
                        )}
                    </div>
                    <p className={styles.feedback} role="status" aria-live="polite">
                        {feedback}
                    </p>
                </div>
            </section>

            <section className={styles.section} aria-labelledby="toast-variants-heading">
                <div className={styles.sectionHeader}>
                    <h2 id="toast-variants-heading" className="h4">
                        Every state, one family.
                    </h2>
                    <p className="body-sm text-ink-muted">
                        Six variants. Shared anatomy and spacing.
                    </p>
                </div>
                <div className={styles.variants}>
                    {TOAST_VARIANTS.map((item) => (
                        <ToastSpecimen
                            key={item.variant}
                            example={TOAST_EXAMPLES.find(
                                (example) => example.id === item.exampleId,
                            )!}
                            onShow={showExample}
                            onAction={runAction}
                        />
                    ))}
                </div>
            </section>

            <section className={styles.section} aria-labelledby="toast-messages-heading">
                <div className={styles.sectionHeader}>
                    <h2 id="toast-messages-heading" className="h4">
                        Messages for the real work.
                    </h2>
                    <p className="body-sm text-ink-muted">
                        {TOAST_EXAMPLES.length} examples · Select any message to preview it.
                    </p>
                </div>
                <div className={styles.filters} role="group" aria-label="Message category">
                    {TOAST_GROUPS.map((item) => (
                        <Button
                            key={item}
                            variant={item === group ? "default" : "outline"}
                            size="md"
                            aria-pressed={item === group}
                            onClick={() => setGroup(item)}
                        >
                            {item}
                        </Button>
                    ))}
                </div>
                <div className={styles.catalog}>
                    {TOAST_EXAMPLES.filter((item) => item.group === group).map((example) => (
                        <button
                            key={example.id}
                            type="button"
                            className={styles.example}
                            aria-pressed={selected.id === example.id}
                            onClick={() => showExample(example)}
                        >
                            <span className={styles.exampleCopy}>
                                <span className={styles.exampleTitle}>{example.title}</span>
                                {example.description && (
                                    <span className={styles.exampleDescription}>
                                        {example.description}
                                    </span>
                                )}
                            </span>
                            <span className={styles.exampleAction}>
                                <span>Preview</span>
                                <ChevronRight aria-hidden="true" size={18} />
                            </span>
                        </button>
                    ))}
                </div>
            </section>

            <section className={styles.section} aria-labelledby="toast-behavior-heading">
                <div className={styles.sectionHeader}>
                    <h2 id="toast-behavior-heading" className="h4">
                        Put it through its paces.
                    </h2>
                </div>
                <div className={styles.buttons}>
                    <Button variant="outline" size="md" onClick={showStack}>
                        <Layers aria-hidden="true" /> Show a stack
                    </Button>
                    <Button variant="outline" size="md" onClick={() => runSaveFlow(true)}>
                        Try a failed save
                    </Button>
                    <Button
                        variant="outline"
                        size="md"
                        onClick={() =>
                            showExample({
                                id: "long-message",
                                group: "Properties",
                                variant: "success",
                                title: "Property created",
                                description:
                                    "Your 3 BHK apartment at Prestige Lakeside Habitat, Varthur–Whitefield Road, Bengaluru, is now live and ready for brokers to discover.",
                                actionLabel: "View property",
                            })
                        }
                    >
                        Try a long message
                    </Button>
                    <Button
                        variant="outline"
                        size="md"
                        onClick={() =>
                            showExample(TOAST_EXAMPLES.find((item) => item.id === "note-saved")!)
                        }
                    >
                        Try a short message
                    </Button>
                </div>
            </section>

            <section className={styles.section} aria-labelledby="toast-guidance-heading">
                <div className={styles.sectionHeader}>
                    <h2 id="toast-guidance-heading" className="h4">
                        Use with intention.
                    </h2>
                </div>
                <div className={styles.guidance}>
                    <div>
                        <h3 className="body font-semibold">Give it time.</h3>
                        <p>
                            Routine confirmations last 5 seconds. Actions, errors, and warnings stay
                            until dismissed. Loading ends when the operation resolves.
                        </p>
                    </div>
                    <div>
                        <h3 className="body font-semibold">Keep the next step close.</h3>
                        <p>
                            Use one clear action. Hover pauses timed messages. Dismissal and actions
                            work with a keyboard, with 44px touch targets and reduced motion
                            support.
                        </p>
                    </div>
                    <div>
                        <h3 className="body font-semibold">Keep important feedback inline.</h3>
                        <p>
                            These error and validation specimens show the visual states. In real
                            forms, errors and required-field guidance must also stay beside the
                            affected input or form.
                        </p>
                    </div>
                </div>
                <pre className={styles.code}>
                    <code>{`showAppToast({\n    variant: "success",\n    title: "Property created",\n    description: "Your listing is live and ready for brokers to discover.",\n    action: { label: "View property", onClick: openProperty },\n}, { toasterId: "your-viewport-id" });`}</code>
                </pre>
            </section>
        </DesignSystemShell>
    );
}
