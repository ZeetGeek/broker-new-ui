import type { ReactNode } from "react";

import { AppModalHeader } from "@/components/shared/app-modal-header";

export function PropertyEditStatus({ children }: { children?: ReactNode }) {
    return (
        <>
            <AppModalHeader title="Edit property" />
            <div className="flex-1 overflow-y-auto p-(--dialog-pad)">
                {children ?? (
                    <p role="status" className="body-sm text-ink-muted">
                        Loading property…
                    </p>
                )}
            </div>
        </>
    );
}
