"use client";
import { createContext, useContext, useEffect, useRef } from "react";

import type { WorkflowTarget } from "@/lib/workflows/target";

export type WorkflowSelection = { target: WorkflowTarget; version: number };
export const WorkflowContext = createContext<{
    open: (href: string) => boolean;
    selection: WorkflowSelection | null;
    close: () => void;
    setWorking: (working: boolean | null) => void;
    registerDismiss: (handler: () => void) => () => void;
    takeNavigationEntry: () => boolean;
} | null>(null);
export const useWorkflow = () => useContext(WorkflowContext)?.open ?? null;
export const useWorkflowState = () => useContext(WorkflowContext);

/** Keep the registry stable across renders while always invoking the latest close/dirty guard. */
export function useWorkflowDismiss(open: boolean, onClose: () => void) {
    const register = useContext(WorkflowContext)?.registerDismiss;
    const latest = useRef(onClose);
    useEffect(() => {
        latest.current = onClose;
    }, [onClose]);
    useEffect(() => {
        if (!open || !register) return;
        // ContactsPage already owns a ?contact history entry; preserve that incumbent behavior.
        if (window.history.state?.contactPanel) return;
        return register(() => latest.current());
    }, [open, register]);
}

/** Local detail-to-edit transitions keep their form safe from unrelated workflow links. */
export function useWorkflowWorking(working: boolean) {
    const setWorking = useContext(WorkflowContext)?.setWorking;
    useEffect(() => {
        setWorking?.(working);
        return () => setWorking?.(null);
    }, [working, setWorking]);
}
