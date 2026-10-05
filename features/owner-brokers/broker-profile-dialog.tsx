"use client";

import { useEffect, useState } from "react";

import { Send, ShieldCheck } from "lucide-react";

import { type BrokerProfile, representativeApi } from "@/lib/api/representative";

import { AppModal } from "@/components/shared/app-modal";
import { Button } from "@/components/ui/button";

import {
    brokerLocationLine,
    BrokerMetricStrip,
    BrokerSpecialtyTags,
} from "@/features/owner-brokers/browse-broker-card";
import { brokerDisplayName } from "@/features/owner-brokers/browse-brokers-filters";

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
    if (!value?.trim()) return null;
    return (
        <div className="flex flex-col gap-1">
            <dt className="eyebrow">{label}</dt>
            <dd className="body-sm text-ink">{value}</dd>
        </div>
    );
}

/**
 * Read-only broker profile for owners. Opens instantly with the card's data,
 * then swaps in the full profile (bio, licence) once it loads.
 */
export function BrokerProfileDialog({
    broker,
    open,
    onOpenChange,
    onInvite,
}: {
    broker: BrokerProfile | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onInvite: (broker: BrokerProfile) => void;
}) {
    const [full, setFull] = useState<BrokerProfile | null>(null);

    useEffect(() => {
        if (!open || !broker?.id) return;
        let cancelled = false;
        void representativeApi
            .ownerBrokerProfile(broker.id)
            .then((profile) => {
                if (!cancelled) setFull(profile);
            })
            .catch(() => {
                /* Card data is enough to show the dialog. */
            });
        return () => {
            cancelled = true;
        };
    }, [open, broker?.id]);

    if (!broker) return null;

    const profile: BrokerProfile = full?.id === broker.id ? { ...broker, ...full } : broker;
    const name = brokerDisplayName(profile);
    const areas = profile.serviceAreas?.filter(Boolean).join(", ");
    const licence = [profile.licenseNumber, profile.reraState].filter(Boolean).join(" · ");

    return (
        <AppModal
            open={open}
            onOpenChange={onOpenChange}
            size="md"
            title={<span className="capitalize">{name}</span>}
            description={[profile.orgName, brokerLocationLine(profile)].filter(Boolean).join(" · ")}
            footer={
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                    <Button
                        onClick={() => {
                            onOpenChange(false);
                            onInvite(profile);
                        }}
                    >
                        <Send aria-hidden strokeWidth={1.75} />
                        Invite to a property
                    </Button>
                </div>
            }
        >
            <div className="flex flex-col gap-5 pbe-2">
                {profile.verified ? (
                    <p
                        className="
                          body-sm flex items-center gap-2 rounded-inner bg-brand-soft px-3 py-2.5
                          text-brand-text
                        "
                    >
                        <ShieldCheck
                            aria-hidden
                            className="shrink-0 block-4 inline-4"
                            strokeWidth={1.75}
                        />
                        Verified broker — details checked by our team.
                    </p>
                ) : null}

                <BrokerMetricStrip broker={profile} />

                {profile.bio?.trim() ? (
                    <p className="body whitespace-pre-line text-ink">{profile.bio.trim()}</p>
                ) : null}

                <BrokerSpecialtyTags specializations={profile.specializations} max={12} />

                <dl className="grid gap-4 sm:grid-cols-2">
                    <DetailRow label="Service areas" value={areas} />
                    <DetailRow label="RERA licence" value={licence} />
                    <DetailRow
                        label="Agency"
                        value={
                            profile.isAgency && profile.agencyStaffCount
                                ? `${profile.agencyStaffCount} brokers on the team`
                                : null
                        }
                    />
                </dl>
            </div>
        </AppModal>
    );
}
