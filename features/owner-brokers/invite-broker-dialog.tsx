"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

import { ApiError } from "@/lib/api/client";
import { propertiesApi } from "@/lib/api/properties";
import { type BrokerProfile, representativeApi } from "@/lib/api/representative";
import { ownerRequestsHref } from "@/lib/routes/owner";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogDescription,
    DialogHeader,
    DialogPopup,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

import { brokerDisplayName } from "@/features/owner-brokers/browse-brokers-filters";

function apiMessage(error: unknown, fallback: string): string {
    return error instanceof ApiError ? error.message : fallback;
}

export function InviteBrokerDialog({
    broker,
    open,
    onOpenChange,
}: {
    broker: BrokerProfile | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const router = useRouter();
    const [propertyId, setPropertyId] = useState("");
    const [message, setMessage] = useState("");
    const [properties, setProperties] = useState<{ id: string; label: string }[]>([]);
    const [propertiesLoading, setPropertiesLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [prevBrokerId, setPrevBrokerId] = useState(broker?.id);
    if (broker?.id !== prevBrokerId) {
        setPrevBrokerId(broker?.id);
        setPropertyId("");
        setMessage("");
    }

    useEffect(() => {
        if (!open) return;
        let cancelled = false;
        const timer = window.setTimeout(() => {
            if (cancelled) return;
            setPropertiesLoading(true);
            void propertiesApi
                .list({ limit: 100, publishStatus: "published" })
                .then((page) => {
                    if (cancelled) return;
                    setProperties(
                        page.items.map((item) => ({
                            id: item.id,
                            label: item.title?.trim() || item.city || "Untitled listing",
                        })),
                    );
                })
                .catch((err) => {
                    if (!cancelled) toast.error(apiMessage(err, "Could not load properties"));
                })
                .finally(() => {
                    if (!cancelled) setPropertiesLoading(false);
                });
        }, 0);
        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [open]);

    const submit = useCallback(async () => {
        if (!broker?.id || !propertyId) {
            toast.error("Pick a property to invite this broker.");
            return;
        }
        setSubmitting(true);
        try {
            await representativeApi.ownerInvite({
                propertyId,
                brokerId: broker.id,
                message: message.trim() || undefined,
            });
            toast.success("Invitation sent");
            onOpenChange(false);
            router.push(ownerRequestsHref("invitations"));
        } catch (err) {
            toast.error(apiMessage(err, "Could not send invitation"));
        } finally {
            setSubmitting(false);
        }
    }, [broker, message, onOpenChange, propertyId, router]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogPopup className="max-inline-lg">
                <DialogHeader>
                    <DialogTitle>
                        Invite {broker ? brokerDisplayName(broker) : "broker"}
                    </DialogTitle>
                    <DialogDescription>
                        Choose a published listing and add an optional note.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                    <label className="flex flex-col gap-1.5">
                        <span className="body-sm font-semibold text-ink">Property</span>
                        <select
                            className="
                              rounded-control border-2 border-border-warm bg-surface px-3.5
                              text-[15px] text-ink block-control-md inline-full
                            "
                            value={propertyId}
                            disabled={propertiesLoading}
                            onChange={(event) => setPropertyId(event.target.value)}
                        >
                            <option value="">
                                {propertiesLoading ? "Loading…" : "Select a property"}
                            </option>
                            {properties.map((property) => (
                                <option key={property.id} value={property.id}>
                                    {property.label}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="flex flex-col gap-1.5">
                        <span className="body-sm font-semibold text-ink">Message (optional)</span>
                        <Textarea
                            value={message}
                            onChange={(event) => setMessage(event.target.value)}
                            placeholder="Why you'd like them to represent this listing"
                            rows={3}
                        />
                    </label>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button loading={submitting} onClick={() => void submit()}>
                            Send invite
                        </Button>
                    </div>
                </div>
            </DialogPopup>
        </Dialog>
    );
}
