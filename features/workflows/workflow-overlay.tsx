"use client";
import { lazy, Suspense, useRef } from "react";
import dynamic from "next/dynamic";

import type { WorkflowTarget } from "@/lib/workflows/target";

import { AppModal } from "@/components/shared/app-modal";
import { useWorkflowState } from "@/components/shared/workflow-context";

import { propertyFormModalLayout } from "@/features/properties/property-form/property-form-modal-layout";

import { PropertyEditStatus } from "./property-edit-status";

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
const PropertyWorkflow = lazy(() =>
    import("./property-workflow").then((module) => ({ default: module.PropertyWorkflow })),
);
const TaskWorkflow = dynamic(
    () => import("./task-workflow").then((module) => module.TaskWorkflow),
    { ssr: false, loading: LoadingWorkflow },
);
const VisitWorkflow = dynamic(
    () => import("./visit-workflow").then((module) => module.VisitWorkflow),
    { ssr: false, loading: LoadingWorkflow },
);

type WorkflowOverlayProps = {
    target: WorkflowTarget;
    onClose: () => void;
};

function PropertyEditWorkflow({
    target,
    onClose,
}: Omit<WorkflowOverlayProps, "target"> & {
    target: Extract<WorkflowTarget, { kind: "property" }>;
}) {
    const modalCloseRequest = useRef<(() => Promise<void>) | null>(null);

    return (
        <AppModal
            open
            title="Edit property"
            showHeader={false}
            scrollBody={false}
            bodyClassName="min-inline-0"
            {...propertyFormModalLayout}
            onOpenChange={(open) => {
                if (open) return;
                if (modalCloseRequest.current) void modalCloseRequest.current();
                else onClose();
            }}
        >
            <Suspense fallback={<PropertyEditStatus />}>
                <PropertyWorkflow
                    target={target}
                    onClose={onClose}
                    modalCloseRequest={modalCloseRequest}
                />
            </Suspense>
        </AppModal>
    );
}

export function WorkflowOverlay({ target, onClose }: WorkflowOverlayProps) {
    switch (target.kind) {
        case "contact":
            return <ContactCreateWorkflow target={target} onClose={onClose} />;
        case "property":
            return target.mode === "edit" ? (
                <PropertyEditWorkflow target={target} onClose={onClose} />
            ) : (
                <Suspense fallback={<LoadingWorkflow />}>
                    <PropertyWorkflow target={target} onClose={onClose} />
                </Suspense>
            );
        case "task":
            return <TaskWorkflow target={target} onClose={onClose} />;
        case "visit":
            return <VisitWorkflow target={target} onClose={onClose} />;
        case "deal":
            return <DealWorkflow target={target} onClose={onClose} />;
    }
}
