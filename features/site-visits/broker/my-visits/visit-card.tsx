"use client";

import { memo } from "react";

import { Copy, ExternalLink, MapPin, MessageCircle, MoreHorizontal, NotebookPen, Phone, Route, Trash2 } from "lucide-react";

import { formatInrCompact } from "@/lib/format/inr";
import { cn } from "@/lib/utils";
import { VISIT_STATUS, visitPrimaryAction } from "@/lib/visits/status";
import { durationMinutes, formatVisitTime } from "@/lib/visits/time";
import { formatVisitDayHeading } from "@/lib/visits/time";

import { AppImage } from "@/components/shared/app-image";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { APP_NAME } from "@/config";
import type { BrokerSiteVisit } from "@/features/site-visits/broker/model";
import { useAppSelector } from "@/store/hooks";

function VisitParty({ label, name, avatarUrl }: { label: string; name: string; avatarUrl?: string }) {
    return (
        <div className="flex items-center gap-2 min-inline-0">
            <UserAvatar name={name} imageUrl={avatarUrl} size="xs" fallback="character" className="
              shrink-0
            " />
            <span className="min-inline-0">
                <span className="block text-[10px] font-medium text-ink-subtle">{label}</span>
                <span className="body-xs block truncate font-semibold text-ink">{name}</span>
            </span>
        </div>
    );
}

export const VisitCard = memo(function VisitCard({
    visit,
    onOpen,
    onAction,
}: {
    visit: BrokerSiteVisit;
    onOpen: (id: string) => void;
    onAction: (action: "outcome" | "reschedule" | "withdraw", id: string) => void;
}) {
    const status = VISIT_STATUS[visit.status];
    const StatusIcon = status.icon;
    const primary = visitPrimaryAction(visit.status, visit.startsAt, Boolean(visit.outcome));
    const primaryLabel = primary === "outcome" ? "Log outcome" : primary === "withdraw" ? "Withdraw" : "Reschedule";
    const buyer = visit.buyers[0];
    const broker = useAppSelector((state) => state.auth.user);
    const brokerName = broker?.fullName?.trim() || broker?.email || "Your broker";
    const mapHref = visit.property.latitude && visit.property.longitude
        ? `https://www.openstreetmap.org/directions?to=${visit.property.latitude},${visit.property.longitude}`
        : `https://www.openstreetmap.org/search?query=${encodeURIComponent(visit.property.address)}`;
    const whatsAppText = encodeURIComponent(`Hi ${buyer.name}, your site visit for ${visit.property.title}, ${visit.property.locality} is confirmed for ${formatVisitDayHeading(visit.startsAt)} at ${formatVisitTime(visit.startsAt)}. Address: ${visit.property.address}. I’ll meet you there. — ${brokerName}, ${APP_NAME}`);

    return (
        <article className="
          group relative overflow-hidden rounded-card border border-border-warm bg-surface p-4
        ">
            <button type="button" onClick={() => onOpen(visit.id)} aria-label={`Open visit at ${visit.property.title}`} className="
              absolute inset-0 z-0 outline-none
              focus-visible:ring-3 focus-visible:ring-brand/30 focus-visible:ring-inset
            " />
            <span className={cn("absolute inset-y-0 inset-s-0 inline-1", status.bar)} aria-hidden />

            <div className="
              relative z-10 grid gap-4
              md:grid-cols-[96px_minmax(0,1fr)_auto] md:items-start
            ">
                <div className="
                  border-be border-border-warm pbe-3
                  md:border-e md:border-be-0 md:pe-4 md:pbe-0
                ">
                    <p className="tabular text-2xl font-bold tracking-[-0.02em] text-ink">{formatVisitTime(visit.startsAt)}</p>
                    <p className="body-xs tabular mbs-1 text-ink-muted">{durationMinutes(visit.startsAt, visit.endsAt)} min</p>
                </div>

                <div className="space-y-3 min-inline-0">
                    <div className="flex gap-3">
                        <div className="
                          relative shrink-0 overflow-hidden rounded-inner bg-surface-muted block-16
                          inline-16
                        ">
                            <AppImage src={visit.property.coverUrl ?? "/properties/1.jpg"} alt="" fill sizes="64px" />
                        </div>
                        <div className="flex-1 min-inline-0">
                            <h3 className="h6 truncate text-ink">{visit.property.title}</h3>
                            <p className="body-xs mbs-1 truncate text-ink-muted">{visit.property.configLabel} · {visit.property.locality} · {visit.property.purpose === "rent" ? `${formatInrCompact(visit.property.amountInr)}/mo` : formatInrCompact(visit.property.amountInr)}</p>
                            <span className={cn(`
                              body-xs mbs-2 inline-flex items-center gap-1 rounded-md border px-2
                              py-1 font-semibold
                            `, status.tone)}><StatusIcon aria-hidden className="
                              block-3.5 inline-3.5
                            " />{status.label}</span>
                        </div>
                    </div>

                    <div className="
                      grid grid-cols-2 gap-3 rounded-inner bg-surface-muted px-3 py-2.5
                    ">
                        <VisitParty label={visit.buyers.length > 1 ? `Buyers · +${visit.buyers.length - 1}` : "Buyer"} name={buyer.name} avatarUrl={buyer.avatarUrl} />
                        <VisitParty label="Owner" name={visit.owner.name} avatarUrl={visit.owner.avatarUrl} />
                    </div>

                    <p className="body-xs flex items-center gap-1.5 text-ink-muted"><MapPin aria-hidden className="
                      block-3.5 inline-3.5
                    " />{visit.distanceKm?.toFixed(1) ?? "—"} km · {visit.driveMinutes ?? "—"} min from your last stop{visit.distanceApproximate ? " · approx" : ""}</p>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger render={<Button type="button" variant="ghost" size="sm" aria-label="More visit actions" onClick={(event) => event.stopPropagation()}><MoreHorizontal aria-hidden /></Button>} />
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem><Copy aria-hidden /> Copy address</DropdownMenuItem>
                        <DropdownMenuItem><NotebookPen aria-hidden /> Add note</DropdownMenuItem>
                        <DropdownMenuItem><ExternalLink aria-hidden /> View property</DropdownMenuItem>
                        <DropdownMenuItem variant="destructive"><Trash2 aria-hidden /> Cancel visit</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <footer className="
              relative z-10 mbs-4 flex flex-wrap gap-2 border-bs border-border-warm pbs-3
            ">
                <Button nativeButton={false} render={<a href={`tel:+91${buyer.phoneDigits}`} />} variant="surface" size="sm" className="
                  flex-1 px-2 min-block-12
                  sm:flex-none sm:px-3 sm:min-block-9
                "><Phone aria-hidden /> Call buyer</Button>
                <Button nativeButton={false} render={<a href={`https://wa.me/91${buyer.phoneDigits}?text=${whatsAppText}`} target="_blank" rel="noreferrer" />} variant="surface" size="sm" className="
                  flex-1 px-2 min-block-12
                  sm:flex-none sm:px-3 sm:min-block-9
                "><MessageCircle aria-hidden /> WhatsApp</Button>
                <Button nativeButton={false} render={<a href={mapHref} target="_blank" rel="noreferrer" />} variant="surface" size="sm" className="
                  flex-1 px-2 min-block-12
                  sm:flex-none sm:px-3 sm:min-block-9
                "><Route aria-hidden /> Navigate</Button>
                {primary ? <Button type="button" size="sm" onClick={() => onAction(primary, visit.id)} className="
                  inline-full min-block-12
                  sm:ms-auto sm:inline-auto sm:min-block-9
                ">{primaryLabel}</Button> : null}
            </footer>
        </article>
    );
});
