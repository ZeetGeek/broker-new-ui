"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

import { ApiError } from "@/lib/api/client";
import { propertiesApi } from "@/lib/api/properties";
import { type BrokerProfile, representativeApi } from "@/lib/api/representative";
import {
    OWNER_PROPERTIES_HREF,
    OWNER_PROPERTIES_NEW_HREF,
    ownerRequestsHref,
} from "@/lib/routes/owner";

import { AppModal } from "@/components/shared/app-modal";
import { AppModalFooter } from "@/components/shared/app-modal-footer";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
    const [propertyId, setPropertyId] = useState<string | null>(null);
    const [message, setMessage] = useState("");
    const [properties, setProperties] = useState<{ id: string; label: string }[]>([]);
    const [propertiesLoading, setPropertiesLoading] = useState(false);
    const [propertiesError, setPropertiesError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const [prevBrokerId, setPrevBrokerId] = useState(broker?.id);
    if (broker?.id !== prevBrokerId) {
        setPrevBrokerId(broker?.id);
        setPropertyId(null);
        setMessage("");
        setFormError(null);
    }

    const loadProperties = useCallback(() => {
        setPropertiesLoading(true);
        setPropertiesError(null);
        void propertiesApi
            .list({ limit: 100, publishStatus: "published" })
            .then((page) => {
                setProperties(
                    page.items.map((item) => ({
                        id: item.id,
                        label: item.title?.trim() || item.city || "Untitled listing",
                    })),
                );
            })
            .catch((err) => {
                setProperties([]);
                setPropertiesError(apiMessage(err, "Could not load your listings."));
            })
            .finally(() => {
                setPropertiesLoading(false);
            });
    }, []);

    useEffect(() => {
        if (!open) return;
        const timer = window.setTimeout(() => loadProperties(), 0);
        return () => window.clearTimeout(timer);
    }, [open, loadProperties]);

    const name = broker ? brokerDisplayName(broker) : "broker";
    const canSubmit = Boolean(broker?.id && propertyId && !submitting && !propertiesLoading);

    const submit = useCallback(async () => {
        if (!broker?.id) return;
        if (!propertyId) {
            setFormError("Pick a published listing for this invite.");
            return;
        }
        setSubmitting(true);
        setFormError(null);
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
            setFormError(apiMessage(err, "Could not send the invitation. Try again."));
        } finally {
            setSubmitting(false);
        }
    }, [broker, message, onOpenChange, propertyId, router]);

    return (
        <AppModal
            open={open}
            onOpenChange={(next) => {
                if (!submitting) onOpenChange(next);
            }}
            size="md"
            title={`Invite ${name}`}
            description="Choose a published listing. They start working on it after accepting your invitation."
            footer={
                <AppModalFooter
                    primaryLabel={submitting ? "Sending…" : "Send invite"}
                    primaryDisabled={!canSubmit}
                    onPrimary={() => void submit()}
                    secondaryLabel="Cancel"
                    secondaryDisabled={submitting}
                    onSecondary={() => onOpenChange(false)}
                />
            }
        >
            <div className="flex flex-col gap-5">
                {propertiesError ? (
                    <div className="flex flex-col items-start gap-2" role="alert">
                        <p className="body-sm text-danger">{propertiesError}</p>
                        <Button variant="outline" size="sm" onClick={loadProperties}>
                            Try again
                        </Button>
                    </div>
                ) : null}

                {!propertiesError && !propertiesLoading && properties.length === 0 ? (
                    <div className="flex flex-col gap-3 rounded-inner bg-surface-muted px-3.5 py-3">
                        <p className="body-sm text-ink">
                            Publish a listing first — then you can invite {name} to represent it.
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                size="sm"
                                variant="accent"
                                nativeButton={false}
                                render={<Link href={OWNER_PROPERTIES_NEW_HREF} />}
                            >
                                Add a listing
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                nativeButton={false}
                                render={<Link href={OWNER_PROPERTIES_HREF} />}
                            >
                                My properties
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-1.5">
                        <span className="body-sm font-semibold text-ink">Property</span>
                        <Select
                            value={propertyId}
                            onValueChange={setPropertyId}
                            disabled={propertiesLoading || submitting || properties.length === 0}
                        >
                            <SelectTrigger
                                loading={propertiesLoading}
                                errorText={
                                    formError && !propertyId
                                        ? "Choose a property to continue"
                                        : undefined
                                }
                            >
                                <SelectValue placeholder="Select a property" />
                            </SelectTrigger>
                            <SelectContent>
                                {properties.map((property) => (
                                    <SelectItem key={property.id} value={property.id}>
                                        {property.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                <label className="flex flex-col gap-1.5">
                    <span className="body-sm font-semibold text-ink">Message (optional)</span>
                    <Textarea
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                        placeholder="Why you’d like them to represent this listing"
                        rows={3}
                        disabled={submitting}
                    />
                </label>

                {formError ? (
                    <p className="body-sm text-danger" role="alert">
                        {formError}
                    </p>
                ) : null}
            </div>
        </AppModal>
    );
}
