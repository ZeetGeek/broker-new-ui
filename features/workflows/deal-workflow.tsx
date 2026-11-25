"use client";

import { useRef, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { clientsApi } from "@/lib/api/clients";
import { pipelineApi } from "@/lib/api/pipeline";
import { saveWorkflowDealOffer, saveWorkflowDealStage } from "@/lib/workflows/deal-actions";
import { notifyWorkflowSaved } from "@/lib/workflows/refresh";
import type { WorkflowTarget } from "@/lib/workflows/target";

import { AppModal } from "@/components/shared/app-modal";
import toast from "@/components/shared/app-toast";
import { useWorkflowWorking } from "@/components/shared/workflow-context";
import { Button } from "@/components/ui/button";

import { FEATURE_PLATFORM_OWNER } from "@/config";
import { DealDetailModal } from "@/features/pipeline/deal-detail-modal";
import { DealNoteModal } from "@/features/pipeline/deal-note-modal";
import { MakeOfferModal } from "@/features/pipeline/make-offer-modal";
import { markSoldBlockedReason, saleConfirmMode } from "@/features/pipeline/sale-mode";
import { DEAL_STAGE_META } from "@/features/pipeline/stage-meta";
import {
    type StageMoveDetails,
    type StageMoveRequest,
    StageNoteModal,
} from "@/features/pipeline/stage-note-modal";
import { type DealStatus, isLiveStage } from "@/features/pipeline/types";
import { useAppSelector } from "@/store/hooks";

type DealTarget = Extract<WorkflowTarget, { kind: "deal" }>;
type SaveIntent =
    | { kind: "note"; note: string; keepOpen?: boolean }
    | { kind: "offer"; amount: number; notes: string }
    | { kind: "stage"; request: StageMoveRequest; note: string; details: StageMoveDetails };

export function DealWorkflow({ target, onClose }: { target: DealTarget; onClose: () => void }) {
    const accountId = useAppSelector((state) => state.auth.user?.id);
    const queryClient = useQueryClient();
    const [mode, setMode] = useState(target.mode);
    const [move, setMove] = useState<StageMoveRequest | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const saving = useRef(false);
    const query = useQuery({
        queryKey: ["workflow-deal", accountId, target.id],
        queryFn: () => pipelineApi.get(target.id),
        retry: 1,
    });
    const deal = query.data ?? null;
    const saleMode = saleConfirmMode({
        isBrokerListing: Boolean(deal?.property.isBrokerListing),
        ownerPortalOn: FEATURE_PLATFORM_OWNER,
    });
    const otherClients = useQuery({
        queryKey: ["workflow-deal-other-clients", accountId, deal?.property.id],
        queryFn: () => clientsApi.listOpenLeadClientIds(deal!.property.id),
        enabled: move?.status === "closed" && deal != null,
        retry: 1,
    });
    const save = useMutation({
        mutationKey: ["workflow-deal-save", accountId, target.id],
        scope: { id: `workflow-deal-save:${accountId}` },
        mutationFn: async (intent: SaveIntent) => {
            if (!deal)
                throw new Error("This deal is not available. Reload its details and try again.");
            if (intent.kind === "offer") {
                await saveWorkflowDealOffer(
                    deal.id,
                    intent.amount,
                    intent.notes,
                    FEATURE_PLATFORM_OWNER,
                );
                return "Offer saved";
            }
            if (intent.kind === "note") {
                await pipelineApi.setNote(deal.id, deal.status, intent.note);
                return "Note saved";
            }
            const result = await saveWorkflowDealStage(
                intent.request.deal ?? deal,
                intent.request.status,
                intent.note,
                intent.details,
                FEATURE_PLATFORM_OWNER,
            );
            return result === "owner"
                ? "Sent to the owner to confirm."
                : intent.request.successMessage;
        },
        onSuccess: (message, intent) => {
            if (intent.kind === "note") {
                queryClient.setQueryData<NonNullable<typeof deal>>(
                    ["workflow-deal", accountId, target.id],
                    (current) => (current ? { ...current, note: intent.note } : current),
                );
            }
            void queryClient.invalidateQueries({
                predicate: (item) =>
                    /^(workflow-deal|pipeline|my-listings|owned-property-detail|dashboard-listings|property-attached-buyers|property-analytics|broker)/.test(
                        String(item.queryKey[0]),
                    ),
            });
            notifyWorkflowSaved("deal");
            toast.success(message);
            if (intent.kind !== "note" || !intent.keepOpen) onClose();
        },
    });
    useWorkflowWorking(mode !== "detail" || move != null || save.isPending);
    const submit = (intent: SaveIntent) => {
        if (saving.current) return;
        saving.current = true;
        save.mutate(intent, {
            onSettled: () => {
                saving.current = false;
            },
        });
    };
    const close = () => {
        if (!save.isPending && !saving.current) onClose();
    };
    const saveError =
        save.error instanceof Error
            ? save.error.message
            : save.isError
              ? "Could not save your changes. Please try again."
              : null;
    const requestStage = (status: DealStatus) => {
        if (!deal || save.isPending) return;
        if (status === "closed") {
            const blocked = markSoldBlockedReason(deal, saleMode);
            if (blocked) {
                setActionError(blocked);
                return;
            }
        }
        setActionError(null);
        save.reset();
        setMove({
            dealId: deal.id,
            status,
            deal,
            successMessage:
                status === "closed"
                    ? deal.property.isRent
                        ? "Marked as rented"
                        : "Marked as sold"
                    : status === "lost"
                      ? "Marked as lost"
                      : `Moved to ${DEAL_STAGE_META[status].label.toLowerCase()}`,
        });
    };
    const openMode = (next: DealTarget["mode"]) => {
        if (!save.isPending) {
            save.reset();
            setActionError(null);
            setMode(next);
        }
    };

    if (!deal && mode !== "detail")
        return (
            <AppModal
                open
                className="contacts-detail-drawer"
                size="md"
                title="Deal details"
                onOpenChange={(open) => {
                    if (!open) close();
                }}
            >
                {query.isError ? (
                    <div role="alert" className="flex flex-col items-start gap-3">
                        <p>Could not load this deal. Check your connection and try again.</p>
                        <Button variant="outline" onClick={() => void query.refetch()}>
                            Retry
                        </Button>
                    </div>
                ) : (
                    <p role="status">Loading deal…</p>
                )}
            </AppModal>
        );

    if (mode === "offer" && (!FEATURE_PLATFORM_OWNER || (deal && !isLiveStage(deal.status))))
        return (
            <AppModal
                open
                className="contacts-detail-drawer"
                size="md"
                title="Offer unavailable"
                onOpenChange={(open) => {
                    if (!open) close();
                }}
            >
                <p className="body-sm text-ink-muted">
                    {!FEATURE_PLATFORM_OWNER
                        ? "Offers are not available in this portal."
                        : "This deal is finished. You can still review its details."}
                </p>
                <Button variant="outline" onClick={() => openMode("detail")}>
                    View deal
                </Button>
            </AppModal>
        );

    const checkingClients =
        move?.status === "closed" && (otherClients.isPending || otherClients.isError);
    return (
        <>
            <DealDetailModal
                open={mode === "detail" && !move}
                deal={deal}
                isLoading={query.isPending}
                error={
                    actionError ??
                    (query.isError
                        ? "Could not load this deal. Check your connection and try again."
                        : null)
                }
                onClose={close}
                onRetry={() => {
                    setActionError(null);
                    void query.refetch();
                }}
                isBusy={save.isPending}
                onStageAction={requestStage}
                onSaveNote={async (note) => {
                    if (saving.current)
                        throw new Error("Another change is still saving. Try again in a moment.");
                    saving.current = true;
                    try {
                        await save.mutateAsync({ kind: "note", note, keepOpen: true });
                    } finally {
                        saving.current = false;
                    }
                }}
                onMakeOffer={
                    FEATURE_PLATFORM_OWNER && deal && isLiveStage(deal.status)
                        ? () => openMode("offer")
                        : undefined
                }
            />
            <MakeOfferModal
                open={mode === "offer"}
                deal={deal}
                isSaving={save.isPending}
                submitError={saveError}
                onConfirm={(amount, notes) => submit({ kind: "offer", amount, notes })}
                onCancel={close}
            />
            <DealNoteModal
                open={mode === "note"}
                deal={deal}
                isSaving={save.isPending}
                submitError={saveError}
                onConfirm={(note) => submit({ kind: "note", note })}
                onCancel={close}
            />
            {checkingClients ? (
                <AppModal
                    open
                    size="sm"
                    title="Review sale"
                    onOpenChange={(open) => {
                        if (!open) setMove(null);
                    }}
                >
                    {otherClients.isError ? (
                        <div role="alert" className="flex flex-col items-start gap-3">
                            <p>Could not check the other clients on this property.</p>
                            <Button variant="outline" onClick={() => void otherClients.refetch()}>
                                Retry
                            </Button>
                        </div>
                    ) : (
                        <p role="status">Checking linked clients…</p>
                    )}
                </AppModal>
            ) : (
                <StageNoteModal
                    open={move != null}
                    deal={deal}
                    request={move}
                    saleMode={saleMode}
                    otherClientCount={
                        otherClients.data?.filter((id) => id !== deal?.buyer.id).length ?? 0
                    }
                    isSaving={save.isPending}
                    submitError={saveError}
                    onConfirm={(note, details) => {
                        if (move) submit({ kind: "stage", request: move, note, details });
                    }}
                    onCancel={() => {
                        if (!save.isPending) {
                            save.reset();
                            setMove(null);
                            void query.refetch();
                        }
                    }}
                />
            )}
        </>
    );
}
