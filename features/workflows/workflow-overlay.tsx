"use client";
import dynamic from "next/dynamic";

import type { WorkflowTarget } from "@/lib/workflows/target";

import { AppModal } from "@/components/shared/app-modal";
import { useWorkflowState } from "@/components/shared/workflow-context";

function LoadingWorkflow() {
    const state = useWorkflowState();
    return (
        <AppModal
            open
            title="Loading…"
            size="md"
            className="contacts-detail-drawer"
            onOpenChange={(open) => {
                if (!open) state?.close();
            }}
        >
            <p role="status" className="body-sm text-ink-muted">
                Opening this panel…
            </p>
        </AppModal>
    );
}
const ContactCreateWorkflow = dynamic(
    () => import("./contact-create-workflow").then((module) => module.ContactCreateWorkflow),
    { ssr: false, loading: LoadingWorkflow },
);
const DealWorkflow = dynamic(
    () => import("./deal-workflow").then((module) => module.DealWorkflow),
    { ssr: false, loading: LoadingWorkflow },
);
const PropertyWorkflow = dynamic(
    () => import("./property-workflow").then((module) => module.PropertyWorkflow),
    { ssr: false, loading: LoadingWorkflow },
);
const TaskWorkflow = dynamic(
    () => import("./task-workflow").then((module) => module.TaskWorkflow),
    { ssr: false, loading: LoadingWorkflow },
);
const VisitWorkflow = dynamic(
    () => import("./visit-workflow").then((module) => module.VisitWorkflow),
    { ssr: false, loading: LoadingWorkflow },
);

export function WorkflowOverlay({
    target,
    onClose,
}: {
    target: WorkflowTarget;
    onClose: () => void;
}) {
    switch (target.kind) {
        case "contact":
            return <ContactCreateWorkflow target={target} onClose={onClose} />;
        case "property":
            return <PropertyWorkflow target={target} onClose={onClose} />;
        case "task":
            return <TaskWorkflow target={target} onClose={onClose} />;
        case "visit":
            return <VisitWorkflow target={target} onClose={onClose} />;
        case "deal":
            return <DealWorkflow target={target} onClose={onClose} />;
    }
}
