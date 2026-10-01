"use client";

import { Clock3 } from "lucide-react";

import type { ShowingStatus, VisitShowing } from "@/lib/api/owner-slots";
import { formatDateIn, formatTimeIn, parseApiInstant } from "@/lib/format/date";
import { cn } from "@/lib/utils";
import { visitAge } from "@/lib/visits/time";

import { AppImage } from "@/components/shared/app-image";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";

const SHOWING_STATUS: Record<ShowingStatus, { label: string; tone: string }> = {
    scheduled: { label: "Needs your reply", tone: "bg-urgent-soft text-pending" },
    confirmed: { label: "Confirmed", tone: "bg-brand-soft text-brand-text" },
    completed: { label: "Done", tone: "bg-brand-soft text-brand-text" },
    cancelled: { label: "Cancelled", tone: "bg-surface-muted text-ink-muted" },
    no_show: { label: "Missed", tone: "bg-danger-soft text-danger" },
};

export function ShowingRow({
    showing,
    busy,
    onConfirm,
    onCancel,
}: {
    showing: VisitShowing;
    busy: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    const status = SHOWING_STATUS[showing.status ?? "scheduled"];
    const canRespond = (showing.status ?? "scheduled") === "scheduled";
    const when = parseApiInstant(showing.scheduledDate);
    const place = [showing.property?.address?.trim(), showing.property?.city].filter(Boolean).join(", ");
    const brokerName = showing.broker?.fullName?.trim() || "Broker";

    return (
        <article className="rounded-card border border-border-warm bg-surface p-4">
            <div className="grid gap-4 sm:grid-cols-[72px_minmax(0,1fr)_auto] sm:items-start">
                <div className="
                  relative overflow-hidden rounded-inner bg-surface-muted block-14 inline-[72px]
                "><AppImage src={showing.property?.photos?.[0] || "/properties/1.jpg"} alt="" fill sizes="72px" /></div>
                <div className="min-inline-0">
                    <div className="flex flex-wrap items-center gap-2"><h3 className="
                      h6 truncate text-ink
                    ">{showing.property?.title?.trim() || "Property"}</h3><span className={cn(
                        "body-xs rounded-md px-2 py-1 font-semibold",
                        status.tone,
                    )}>{status.label}</span></div>
                    <div className="mbs-2 flex items-center gap-2"><UserAvatar name={brokerName} imageUrl={showing.broker?.avatarUrl ?? undefined} size="xs" fallback="character" /><p className="
                      body-xs text-ink
                    "><span className="body-sm font-semibold">{brokerName}</span>{place ? <span className="
                      text-ink-muted
                    "> · {place}</span> : null}</p></div>
                    {showing.createdAt ? <p className="
                      body-xs mbs-2 flex items-center gap-1.5 text-ink-muted
                    "><Clock3 aria-hidden className="block-3.5 inline-3.5" />{visitAge(showing.createdAt).replace("asked", "booked")}</p> : null}
                    {showing.notes ? <p className="
                      body-xs mbs-2 rounded-inner bg-surface-muted px-3 py-2 text-ink-muted
                    ">“{showing.notes}”</p> : null}
                </div>
                <div className="sm:text-end"><p className="body-xs text-ink-muted">Visit at</p><p className="
                  tabular text-lg font-bold text-ink
                ">{formatTimeIn(when)}</p><p className="body-xs text-ink-muted">{formatDateIn(when)}</p></div>
            </div>

            {canRespond ? <footer className="
              mbs-4 flex flex-wrap justify-end gap-2 border-bs border-border-warm pbs-3
            "><Button variant="ghost" size="md" onClick={onCancel} disabled={busy}>Cancel</Button><Button size="md" onClick={onConfirm} loading={busy}>Confirm</Button></footer> : null}
        </article>
    );
}
