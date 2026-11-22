"use client";
import type { ComponentProps } from "react";
import Link from "next/link";

import { navigateWorkflow } from "@/lib/workflows/navigation";

import { usePersonDetails } from "@/components/shared/person-details-context";
import { useWorkflow } from "@/components/shared/workflow-context";

/** Keep real hrefs for modified clicks, direct access and browser link menus. */
export function WorkflowLink({ onNavigate, ...props }: ComponentProps<typeof Link>) {
    const open = useWorkflow();
    const openPerson = usePersonDetails();
    return (
        <Link
            {...props}
            onNavigate={(event) =>
                navigateWorkflow(
                    event,
                    onNavigate,
                    open,
                    props.href,
                    (href) =>
                        openPerson?.(
                            href,
                            typeof props.children === "string" ? props.children : "Contact",
                        ) ?? false,
                )
            }
        />
    );
}
