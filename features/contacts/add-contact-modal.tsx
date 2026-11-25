"use client";

import { useCallback, useId, useState } from "react";

import { AppModal } from "@/components/shared/app-modal";
import { AppModalFooter } from "@/components/shared/app-modal-footer";
import { Home, User } from "@/components/shared/icons";
import { SlidingTabs } from "@/components/shared/sliding-tabs";

import { AddBuyerModal } from "@/features/contacts/add-buyer-modal";
import { AddOwnerModal } from "@/features/contacts/add-owner-modal";
import { CONTACT_FORM_DRAWER_CLASS } from "@/features/contacts/contact-form-ui";

type ContactType = "client" | "owner";
type FormState = { isDirty: boolean; busy: boolean };

export function AddContactModal({
    open,
    initialType,
    onOpenChange,
    onClientCreated,
    onOwnerSaved,
}: {
    open: boolean;
    initialType: ContactType;
    onOpenChange: (open: boolean) => void;
    onClientCreated: (name: string, id?: string) => void;
    onOwnerSaved: (name: string, mode: "created" | "updated", id?: string) => void;
}) {
    const id = useId();
    const [tab, setTab] = useState(initialType);
    const [wasOpen, setWasOpen] = useState(open);
    const [discardOpen, setDiscardOpen] = useState(false);
    const [clientState, setClientState] = useState<FormState>({ isDirty: false, busy: false });
    const [ownerState, setOwnerState] = useState<FormState>({ isDirty: false, busy: false });
    if (open !== wasOpen) {
        setWasOpen(open);
        setDiscardOpen(false);
        if (open) setTab(initialType);
    }
    const busy = clientState.busy || ownerState.busy;
    const requestClose = (next: boolean) => {
        if (busy) return;
        if (!next && (clientState.isDirty || ownerState.isDirty)) {
            setDiscardOpen(true);
            return;
        }
        onOpenChange(next);
    };
    const updateClientState = useCallback((state: FormState) => setClientState(state), []);
    const updateOwnerState = useCallback((state: FormState) => setOwnerState(state), []);

    return (
        <>
            <AppModal
                open={open}
                onOpenChange={requestClose}
                title={tab === "client" ? "Add client" : "Add owner"}
                size="lg"
                padding="md"
                scrollBody={false}
                className={CONTACT_FORM_DRAWER_CLASS}
                bodyClassName="p-0!"
                headerClassName="!space-y-0 !pbs-(--dialog-pad) !pbe-0"
                header={
                    <div
                        inert={busy}
                        aria-disabled={busy || undefined}
                        className="border-be border-border-warm pbe-(--dialog-pad)"
                    >
                        <SlidingTabs
                            stretch
                            height={52}
                            label="Contact type"
                            value={tab}
                            onValueChange={setTab}
                            panelId={`${id}-panel`}
                            options={[
                                {
                                    value: "client",
                                    label: (
                                        <>
                                            <User aria-hidden className="block-4.5 inline-4.5" />
                                            Client
                                        </>
                                    ),
                                    id: `${id}-client`,
                                },
                                {
                                    value: "owner",
                                    label: (
                                        <>
                                            <Home aria-hidden className="block-4.5 inline-4.5" />
                                            Owner
                                        </>
                                    ),
                                    id: `${id}-owner`,
                                },
                            ]}
                        />
                    </div>
                }
            >
                <div
                    id={`${id}-panel`}
                    role="tabpanel"
                    aria-labelledby={`${id}-${tab}`}
                    className="flex flex-1 flex-col min-block-0"
                >
                    <div
                        data-contact-create-panel
                        hidden={tab !== "client"}
                        className="flex flex-1 flex-col min-block-0 [[hidden]]:hidden"
                    >
                        <AddBuyerModal
                            open={open}
                            onOpenChange={(next) => {
                                if (!next && ownerState.isDirty) setTab("owner");
                                else onOpenChange(next);
                            }}
                            onCreated={onClientCreated}
                            embedded={{
                                active: tab === "client",
                                onStateChange: updateClientState,
                            }}
                        />
                    </div>
                    <div
                        data-contact-create-panel
                        hidden={tab !== "owner"}
                        className="flex flex-1 flex-col min-block-0 [[hidden]]:hidden"
                    >
                        <AddOwnerModal
                            open={open}
                            onOpenChange={(next) => {
                                if (!next && clientState.isDirty) setTab("client");
                                else onOpenChange(next);
                            }}
                            onSaved={onOwnerSaved}
                            embedded={{ active: tab === "owner", onStateChange: updateOwnerState }}
                        />
                    </div>
                </div>
            </AppModal>
            <AppModal
                open={discardOpen}
                onOpenChange={setDiscardOpen}
                size="sm"
                title="Discard unsaved changes?"
                description="Unsaved details in both tabs will be lost if you leave now."
                footer={
                    <AppModalFooter
                        className="flex flex-wrap justify-end gap-2"
                        secondaryLabel="Keep editing"
                        secondaryVariant="ghost"
                        onSecondary={() => setDiscardOpen(false)}
                        primaryLabel="Discard changes"
                        primaryVariant="destructive"
                        onPrimary={() => {
                            setDiscardOpen(false);
                            onOpenChange(false);
                        }}
                    />
                }
            >
                <p className="body text-ink-muted">You can keep editing or discard and close.</p>
            </AppModal>
        </>
    );
}
