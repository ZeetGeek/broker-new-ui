"use client";

import { memo } from "react";

import {
    Copy,
    ExternalLink,
    MapPin,
    MessageCircle,
    MoreHorizontal,
    NotebookPen,
    Phone,
    Route,
    Trash2,
} from "lucide-react";

import { APP_NAME } from "@/config";
import { formatInrCompact } from "@/lib/format/inr";
import { cn } from "@/lib/utils";
import { VISIT_STATUS, visitPrimaryAction } from "@/lib/visits/status";
import { durationMinutes, formatVisitDayHeading, formatVisitTime } from "@/lib/visits/time";

import { AppImage } from "@/components/shared/app-image";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { BrokerSiteVisit } from "@/features/site-visits/broker/model";
import { useAppSelector } from "@/store/hooks";

function VisitParty({
    label,
    name,
    avatarUrl,
}: {
    label: string;
    name: string;
    avatarUrl?: string;
}) {
    return (
        <div className="flex items-center gap-2 min-inline-0">
            <UserAvatar
                name={name}
                imageUrl={avatarUrl}
                size="xs"
                fallback="character"
                className="shrink-0"
            />
            <span className="min-inline-0">
                <span className="body-xs block text-ink-subtle">{label}</span>
                <span className="body-sm block truncate font-semibold text-ink">{name}</span>
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
    const primaryLabel =
        primary === "outcome" ? "Log outcome" : primary === "withdraw" ? "Withdraw" : "Reschedule";
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
        <article className="group relative border-be border-border-warm p-4 last:border-be-0 md:p-5">
            <button
                type="button"
                onClick={() => onOpen(visit.id)}
                aria-label={`Open visit at ${visit.property.title}`}
                className="absolute inset-0 z-0 outline-none focus-visible:ring-3 focus-visible:ring-brand/30 focus-visible:ring-inset"
            />

            <div className="relative z-10 grid gap-4 lg:grid-cols-[104px_minmax(260px,1.25fr)_minmax(240px,0.8fr)_auto] lg:items-center">
                <div className="flex items-center justify-between gap-3 lg:block">
                    <div>
                        <p className="h5 tabular-nums text-ink">
                            {formatVisitTime(visit.startsAt)}
                        </p>
                        <p className="body-xs tabular-nums mbs-1 text-ink-muted">
                            {durationMinutes(visit.startsAt, visit.endsAt)} min
                        </p>
                    </div>
                    <Badge variant="outline" className={cn("lg:mbs-3", status.tone)}>
                        <StatusIcon aria-hidden />
                        {status.label}
                    </Badge>
                </div>

                <div className="flex items-center gap-3 min-inline-0">
                    <div className="relative shrink-0 overflow-hidden rounded-[8px] bg-surface-muted block-16 inline-20">
                        <AppImage
                            src={visit.property.coverUrl ?? "/properties/1.jpg"}
                            alt=""
                            fill
                            sizes="80px"
                        />
                    </div>
                    <div className="min-inline-0">
                        <h3 className="h6 truncate text-ink">{visit.property.title}</h3>
                        <p className="body-sm mbs-1 truncate text-ink-muted">
                            {visit.property.configLabel} · {visit.property.locality} ·{" "}
                            {visit.property.purpose === "rent"
                                ? `${formatInrCompact(visit.property.amountInr)}/mo`
                                : formatInrCompact(visit.property.amountInr)}
                        </p>
                        <p className="body-xs mbs-2 flex items-center gap-1.5 text-ink-muted">
                            <MapPin aria-hidden className="block-3.5 inline-3.5" />
                            {visit.distanceKm?.toFixed(1) ?? "—"} km · {visit.driveMinutes ?? "—"}{" "}
                            min from your last stop{visit.distanceApproximate ? " · approx" : ""}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 rounded-inner bg-surface-muted p-3">
                    <VisitParty
                        label={
                            visit.buyers.length > 1
                                ? `Buyers · +${visit.buyers.length - 1}`
                                : "Buyer"
                        }
                        name={buyer.name}
                        avatarUrl={buyer.avatarUrl}
                    />
                    <VisitParty
                        label="Owner"
                        name={visit.owner.name}
                        avatarUrl={visit.owner.avatarUrl}
                    />
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger
                        render={
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-md"
                                aria-label="More visit actions"
                                onClick={(event) => event.stopPropagation()}
                            >
                                <MoreHorizontal aria-hidden />
                            </Button>
                        }
                    />
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                            <Copy aria-hidden /> Copy address
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <NotebookPen aria-hidden /> Add note
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <ExternalLink aria-hidden /> View property
                        </DropdownMenuItem>
                        <DropdownMenuItem variant="destructive">
                            <Trash2 aria-hidden /> Cancel visit
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <footer className="relative z-10 mbs-4 flex flex-wrap gap-2 border-bs border-border-warm pbs-3 lg:ms-[120px]">
                <Button
                    nativeButton={false}
                    render={<a href={`tel:+91${buyer.phoneDigits}`} />}
                    variant="ghost"
                    size="md"
                    className="flex-1 md:flex-none"
                >
                    <Phone aria-hidden /> Call buyer
                </Button>
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
                    size="md"
                    className="flex-1 md:flex-none"
                >
                    <MessageCircle aria-hidden /> WhatsApp
                </Button>
                <Button
                    nativeButton={false}
                    render={<a href={mapHref} target="_blank" rel="noreferrer" />}
                    variant="ghost"
                    size="md"
                    className="flex-1 md:flex-none"
                >
                    <Route aria-hidden /> Navigate
                </Button>
                {primary ? (
                    <Button
                        type="button"
                        size="md"
                        onClick={() => onAction(primary, visit.id)}
                        className="inline-full md:ms-auto md:inline-auto"
                    >
                        {primaryLabel}
                    </Button>
                ) : null}
            </footer>
        </article>
    );
});
