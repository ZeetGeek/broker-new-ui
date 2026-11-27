"use client";

import {
    type ComponentProps,
    type CSSProperties,
    type ReactElement,
    type ReactNode,
    useEffect,
    useState,
} from "react";

import SimpleBar from "simplebar-react";

import { observeScrollOverflow } from "@/lib/styles/scroll-overflow";
import { cn } from "@/lib/utils";

import { AppModalHeader } from "@/components/shared/app-modal-header";
import { useWorkflowDismiss } from "@/components/shared/workflow-context";
import { Dialog, DialogFooter, DialogPopup, DialogTrigger } from "@/components/ui/dialog";

import "simplebar-react/dist/simplebar.min.css";
import styles from "./app-modal.module.css";

const SIZE_CLASS: Record<NonNullable<AppModalProps["size"]>, string> = {
    sm: `
      inline-[min(24rem,calc(100vw-1.5rem))]
      max-inline-[min(24rem,calc(100vw-1.5rem))]
    `,
    md: `
      inline-[min(32rem,calc(100vw-1.5rem))]
      max-inline-[min(32rem,calc(100vw-1.5rem))]
    `,
    lg: `
      inline-[min(48rem,calc(100vw-1.5rem))]
      max-inline-[min(48rem,calc(100vw-1.5rem))]
      sm:inline-[min(48rem,calc(100vw-2rem))]
      sm:max-inline-[min(48rem,calc(100vw-2rem))]
    `,
    xl: `
      inline-[min(76rem,calc(100vw-1rem))]
      max-inline-[min(76rem,calc(100vw-1rem))]
      sm:inline-[min(76rem,calc(100vw-2rem))]
      sm:max-inline-[min(76rem,calc(100vw-2rem))]
    `,
    full: `
      inline-[calc(100vw-1rem)]
      max-inline-[calc(100vw-1rem)]
      sm:inline-[calc(100vw-2rem)]
      sm:max-inline-[calc(100vw-2rem)]
    `,
};

const PAD_VALUE: Record<NonNullable<AppModalProps["padding"]>, string> = {
    sm: "1rem",
    md: "1.25rem",
    lg: "1.5rem",
    xl: "2rem",
};

function hasVisibleDescription(description: ReactNode | undefined): boolean {
    if (description == null || description === false) return false;
    if (typeof description === "string") return description.trim().length > 0;
    return true;
}

export type AppModalProps = {
    open: boolean;
    trigger?: ReactElement;
    onOpenChangeComplete?: ComponentProps<typeof Dialog>["onOpenChangeComplete"];
    /** Existing URL-owned drawers can retain their own Back behavior. */
    manageBrowserHistory?: boolean;
    nativeScroll?: boolean;
    /** Working surfaces with their own scrolling (chat, property editor, filter sheets). */
    scrollBody?: boolean;
    /** Show a bottom fade while the native scroll viewport has more content below. */
    scrollFade?: boolean;
    /** Temporarily release modal focus when a nested external lightbox owns it. */
    modal?: boolean;
    onOpenChange: (open: boolean) => void;
    title: ReactNode;
    /** Optional — omitted or empty string hides the description entirely */
    description?: ReactNode;
    /** Extra sticky content under the title (tabs, filters, etc.) */
    header?: ReactNode;
    headerActions?: ReactNode;
    footer?: ReactNode;
    children: ReactNode;
    showCloseButton?: boolean;
    closeDisabled?: boolean;
    /** Fullscreen forms may render AppModalHeader inside their disabled fieldset. */
    showHeader?: boolean;
    /** Horizontal size of the popup */
    size?: "sm" | "md" | "lg" | "xl" | "full";
    /** Controls --dialog-pad (header/body/footer inset) */
    padding?: "sm" | "md" | "lg" | "xl";
    className?: string;
    /** Merged onto the popup (e.g. custom width that must beat size tokens). */
    style?: CSSProperties;
    bodyClassName?: string;
    headerClassName?: string;
    footerClassName?: string;
    titleClassName?: string;
    descriptionClassName?: string;
};

/**
 * Product modal shell — same look as compound Dialog:
 * one surface, content-height, shared title row and bordered close button.
 */
export function AppModal({
    open,
    trigger,
    onOpenChangeComplete,
    manageBrowserHistory = true,
    nativeScroll = true,
    scrollBody = true,
    scrollFade = false,
    modal = true,
    onOpenChange,
    title,
    description,
    header,
    headerActions,
    footer,
    children,
    showCloseButton = true,
    closeDisabled = false,
    showHeader = true,
    size = "md",
    padding = "lg",
    className,
    style,
    bodyClassName,
    headerClassName,
    footerClassName,
    titleClassName,
    descriptionClassName,
}: AppModalProps) {
    useWorkflowDismiss(open && manageBrowserHistory, () => onOpenChange(false));
    const [body, setBody] = useState<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!open || !body) return undefined;
        const stop = observeScrollOverflow(body, (hasMoreBelow) => {
            body.toggleAttribute("data-scroll-below", hasMoreBelow);
        });
        return () => {
            stop();
            body.removeAttribute("data-scroll-below");
        };
    }, [open, body]);

    const pad = PAD_VALUE[padding];
    const showDescription = hasVisibleDescription(description);
    const titleClass = cn("font-display text-lg font-medium text-ink", titleClassName);

    return (
        <Dialog
            open={open}
            modal={modal}
            onOpenChange={onOpenChange}
            onOpenChangeComplete={onOpenChangeComplete}
        >
            {trigger ? <DialogTrigger render={trigger} /> : null}
            <DialogPopup
                showCloseButton={false}
                style={{ "--dialog-pad": pad, ...style } as CSSProperties}
                className={cn(
                    `
                      flex flex-col gap-0 overflow-hidden bg-surface p-0
                      max-block-[min(88dvh,calc(100%-1.5rem))]
                    `,
                    SIZE_CLASS[size],
                    className,
                )}
            >
                {showHeader ? (
                    <AppModalHeader
                        title={title}
                        showCloseButton={showCloseButton}
                        closeDisabled={closeDisabled}
                        titleClassName={cn(titleClass, "not-sr-only")}
                        description={showDescription ? description : undefined}
                        descriptionClassName={descriptionClassName}
                        contentClassName={headerClassName}
                        actions={headerActions}
                    >
                        {header}
                    </AppModalHeader>
                ) : null}

                {children == null ? null : !scrollBody ? (
                    <div
                        ref={setBody}
                        className={cn(
                            styles.body,
                            "flex flex-1 flex-col overflow-hidden min-block-0",
                            bodyClassName,
                        )}
                    >
                        {children}
                    </div>
                ) : (
                    <div
                        ref={setBody}
                        className={cn(
                            styles.body,
                            "relative flex-1 min-block-0",
                            nativeScroll ? "overflow-y-auto overscroll-contain" : "overflow-hidden",
                        )}
                    >
                        {nativeScroll ? (
                            <div className={cn("p-(--dialog-pad)", bodyClassName)}>{children}</div>
                        ) : (
                            <SimpleBar
                                className="app-modal-simplebar block-full"
                                style={{ maxHeight: "100%" }}
                                autoHide
                            >
                                <div className={cn("p-(--dialog-pad)", bodyClassName)}>
                                    {children}
                                </div>
                            </SimpleBar>
                        )}
                    </div>
                )}

                {scrollFade ? (
                    <div aria-hidden data-slot="dialog-scroll-fade" className={styles.scrollFade} />
                ) : null}

                {footer ? (
                    <DialogFooter className={cn(styles.footer, "block", footerClassName)}>
                        {footer}
                    </DialogFooter>
                ) : null}
            </DialogPopup>
        </Dialog>
    );
}
