"use client";

import { useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { ownersApi } from "@/lib/api/owners";
import { representativeApi } from "@/lib/api/representative";
import type { PersonDetailsTarget } from "@/lib/contacts/person-details-target";
import { formatPersonName } from "@/lib/format/person-name";

import { EmptyState } from "@/components/empty-state";
import { AppModal } from "@/components/shared/app-modal";
import { RefreshCw, UserRound } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";

import { ContactDetailsOverlay } from "@/features/contacts/contact-details-overlay";
import { BrokerProfileDialog } from "@/features/owner-brokers/broker-profile-dialog";
import { InviteBrokerDialog } from "@/features/owner-brokers/invite-broker-dialog";
import { OwnerProfileView } from "@/features/owners/owner-profile-page";
import { useAppSelector } from "@/store/hooks";

export function PersonDetailsOverlay({
    target,
    onClose,
}: {
    target: PersonDetailsTarget;
    onClose: () => void;
}) {
    if (target.kind === "contact")
        return <ContactDetailsOverlay target={target} onClose={onClose} />;
    return <ProfileOverlay target={target} onClose={onClose} />;
}

function ProfileOverlay({
    target,
    onClose,
}: {
    target: Exclude<PersonDetailsTarget, { kind: "contact" }>;
    onClose: () => void;
}) {
    const [invite, setInvite] = useState(false);
    const accountId = useAppSelector((state) => state.auth.user?.id);
    const owner = useQuery({
        queryKey: ["person-details", accountId, "owner-profile", target.id],
        queryFn: ({ signal }) => ownersApi.get(target.id, signal),
        enabled: target.kind === "owner-profile",
    });
    const broker = useQuery({
        queryKey: ["person-details", accountId, "broker-profile", target.id],
        queryFn: () => representativeApi.ownerBrokerProfile(target.id),
        enabled: target.kind === "broker-profile",
    });
    const query = target.kind === "owner-profile" ? owner : broker;
    const changeOpen = (open: boolean) => {
        if (!open) onClose();
    };
    if (target.kind === "broker-profile" && broker.data)
        return (
            <>
                <BrokerProfileDialog
                    broker={broker.data}
                    open={!invite}
                    onOpenChange={changeOpen}
                    onInvite={() => setInvite(true)}
                    closeOnInvite={false}
                    sidebar
                />
                {invite ? (
                    <InviteBrokerDialog
                        broker={broker.data}
                        open
                        onOpenChange={(open) => {
                            if (!open) setInvite(false);
                        }}
                    />
                ) : null}
            </>
        );
    return (
        <AppModal
            open
            onOpenChange={changeOpen}
            title={`${formatPersonName(target.name)} details`}
            size="md"
            className="contacts-detail-drawer"
        >
            {query.isError && target.kind === "owner-profile" ? (
                <EmptyState
                    size="card"
                    variant="error"
                    icon={UserRound}
                    heading="Could not load this owner"
                    description="Check your connection and try again."
                    action={{
                        label: "Try again",
                        icon: RefreshCw,
                        onClick: () => void query.refetch(),
                        disabled: query.isFetching,
                    }}
                />
            ) : query.isError ? (
                <div role="alert" className="flex flex-col items-start gap-3">
                    <p className="body-sm text-ink-muted">
                        Could not load this profile. Check your connection and try again.
                    </p>
                    <Button variant="outline" onClick={() => void query.refetch()}>
                        Retry
                    </Button>
                </div>
            ) : owner.data && target.kind === "owner-profile" ? (
                <OwnerProfileView profile={owner.data} embedded />
            ) : (
                <p role="status" className="body-sm text-ink-muted">
                    Loading details…
                </p>
            )}
        </AppModal>
    );
}
