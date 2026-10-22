"use client";

import { memo } from "react";

import { CallIcon, Navigation, WhatsAppIcon } from "@/components/shared/icons";

import { APP_NAME } from "@/config";
import { cn } from "@/lib/utils";
import { VISIT_STATUS, visitPrimaryAction } from "@/lib/visits/status";
import { formatVisitDayHeading, formatVisitTime } from "@/lib/visits/time";

import { Button } from "@/components/ui/button";

import type { BrokerSiteVisit } from "@/features/site-visits/broker/model";
import { useAppSelector } from "@/store/hooks";

export const VisitTimelineRow = memo(function VisitTimelineRow({
    visit,
    onOpen,
    onAction,
}: {
    visit: BrokerSiteVisit;
    onOpen: (id: string) => void;
    onAction: (action: "outcome" | "reschedule" | "withdraw", id: string) => void;
}) {
    const status = VISIT_STATUS[visit.status];
    const primary = visitPrimaryAction(visit.status, visit.startsAt, Boolean(visit.outcome));
    const primaryLabel =
        primary === "outcome"
            ? "Log outcome"
            : primary === "withdraw"
              ? "Cancel request"
              : "Reschedule";
    const buyer = visit.buyers[0];
    const broker = useAppSelector((state) => state.auth.user);
    const brokerName = broker?.fullName?.trim() || broker?.email || "Your broker";
    const mapHref =
        visit.property.latitude && visit.property.longitude
            ? `https://www.openstreetmap.org/directions?to=${visit.property.latitude},${visit.property.longitude}`
            : `https://www.openstreetmap.org/search?query=${encodeURIComponent(visit.property.address)}`;
    const whatsAppText = encodeURIComponent(
        `Hi ${buyer.name}, your site visit for ${visit.property.title}, ${visit.property.locality} is confirmed for ${formatVisitDayHeading(visit.startsAt)} at ${formatVisitTime(visit.startsAt)}. Address: ${visit.property.address}. I’ll meet you there. — ${brokerName}, ${APP_NAME}`,
    );

    return (
        <article className="group relative rounded-inner px-2 py-3 transition-colors duration-160 hover:bg-surface-muted/80">
            <button
                type="button"
                onClick={() => onOpen(visit.id)}
                aria-label={`Open visit at ${visit.property.title}`}
                className="absolute inset-0 z-0 rounded-inner outline-none focus-visible:ring-3 focus-visible:ring-brand/30"
            />

            <div className="relative z-10 flex items-start gap-3">
                <div className="shrink-0 tabular-nums min-inline-16">
                    <p className="body-sm font-bold text-ink">{formatVisitTime(visit.startsAt)}</p>
                    <p
                        className={cn(
                            "body-xs mbs-0.5 font-semibold",
                            status.awaitingOwner ? "text-pending" : "text-ink-muted",
                        )}
                    >
                        {status.label}
                    </p>
                </div>

                <div className="min-inline-0 flex-1">
                    <p className="body-sm truncate font-semibold text-ink">
                        {visit.property.title}
                    </p>
                    <p className="body-xs mbs-0.5 truncate text-ink-muted">
                        {visit.property.locality}
                        {buyer?.name ? ` · ${buyer.name}` : ""}
                        {visit.owner.name ? ` · ${visit.owner.name}` : ""}
                    </p>

                    <div className="relative z-10 mbs-2 flex flex-wrap gap-1">
                        {buyer?.phoneDigits ? (
                            <Button
                                nativeButton={false}
                                render={<a href={`tel:+91${buyer.phoneDigits}`} />}
                                variant="ghost"
                                size="sm"
                                className="px-2"
                            >
                                <CallIcon aria-hidden className="block-3.5 inline-3.5" />
                                Call
                            </Button>
                        ) : null}
                        {buyer?.phoneDigits ? (
                            <Button
                                nativeButton={false}
                                render={
                                    <a
                                        href={`https://wa.me/91${buyer.phoneDigits}?text=${whatsAppText}`}
                                        target="_blank"
                                        rel="noreferrer"
                                    />
                                }
                                variant="ghost"
                                size="sm"
                                className="px-2"
                            >
                                <WhatsAppIcon aria-hidden className="block-3.5 inline-3.5" />
                                WhatsApp
                            </Button>
                        ) : null}
                        <Button
                            nativeButton={false}
                            render={<a href={mapHref} target="_blank" rel="noreferrer" />}
                            variant="ghost"
                            size="sm"
                            className="px-2"
                        >
                            <Navigation aria-hidden className="block-3.5 inline-3.5" />
                            Go
                        </Button>
                        {primary ? (
                            <Button
                                type="button"
                                size="sm"
                                className="ms-auto"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    onAction(primary, visit.id);
                                }}
                            >
                                {primaryLabel}
                            </Button>
                        ) : null}
                    </div>
                </div>
            </div>
        </article>
    );
});
