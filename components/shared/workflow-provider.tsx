"use client";
import { type ReactNode, useCallback, useRef, useState } from "react";
import toast from "react-hot-toast";
import { usePathname } from "next/navigation";

import { isWorkingWorkflow, workflowTarget } from "@/lib/workflows/target";

import {
    useWorkflowState,
    WorkflowContext,
    type WorkflowSelection,
} from "@/components/shared/workflow-context";
import { useWorkflowHistory } from "@/components/shared/workflow-history";

import { WorkflowOverlay } from "@/features/workflows/workflow-overlay";
import { useAppSelector } from "@/store/hooks";

export function WorkflowProvider({
    children,
    portal,
}: {
    children: ReactNode;
    portal: "broker" | "owner";
}) {
    const pathname = usePathname();
    const accountId = useAppSelector((state) => state.auth.user?.id);
    const location = `${accountId}:${pathname}`;
    const registerDismiss = useWorkflowHistory(location);
    const [route, setRoute] = useState(location);
    const [selection, setSelection] = useState<WorkflowSelection | null>(null);
    const opener = useRef<HTMLElement | null>(null);
    const version = useRef(0);
    const working = useRef<boolean | null>(null);
    const setWorking = useCallback((next: boolean | null) => {
        working.current = next;
    }, []);
    if (route !== location) {
        setRoute(location);
        setSelection(null);
    }
    const open = useCallback(
        (href: string) => {
            const target = workflowTarget(href, portal);
            if (!target) return false;
            if (selection && (working.current ?? isWorkingWorkflow(selection.target))) {
                if (JSON.stringify(selection.target) !== JSON.stringify(target))
                    toast("Finish or close this form before opening another.", {
                        id: "workflow-form-active",
                    });
                return true;
            }
            if (!selection || !opener.current?.isConnected)
                opener.current =
                    document.activeElement instanceof HTMLElement ? document.activeElement : null;
            working.current = null;
            setSelection({ target, version: ++version.current });
            return true;
        },
        [portal, selection],
    );
    const close = useCallback(() => {
        setSelection(null);
        working.current = null;
        const element = opener.current;
        requestAnimationFrame(() => {
            if (element?.isConnected) element.focus({ preventScroll: true });
        });
    }, []);
    return (
        <WorkflowContext value={{ open, selection, close, setWorking, registerDismiss }}>
            {children}
        </WorkflowContext>
    );
}

export function WorkflowHost() {
    const state = useWorkflowState();
    return state?.selection ? (
        <WorkflowOverlay
            key={state.selection.version}
            target={state.selection.target}
            onClose={state.close}
        />
    ) : null;
}
