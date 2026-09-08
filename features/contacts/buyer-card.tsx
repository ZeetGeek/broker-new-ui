"use client";

import { Home, KeyRound, MapPin, MessageCircle, Paperclip, TrendingUp } from "lucide-react";

import { formatRelativePast } from "@/lib/format/date";
import { formatWhatsAppUrl } from "@/lib/format/phone";
import { formatPriceInr, formatRentInr } from "@/lib/format/price";
import { cn } from "@/lib/utils";

import { PhoneNumber } from "@/components/shared/phone-number";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { ChatButton } from "@/features/chat/chat-button";
import {
    BUYER_DOCUMENT_KIND_LABEL,
    documentIcon,
    formatFileSize,
} from "@/features/contacts/document-rules";
import type { BuyerRow } from "@/features/contacts/types";

function budgetLabel(buyer: BuyerRow): string | null {
    if (buyer.budgetMaxInr === null) return null;
    const amount =
        buyer.lookingFor === "rent"
            ? formatRentInr(buyer.budgetMaxInr)
            : formatPriceInr(buyer.budgetMaxInr);
    return `Up to ${amount}`;
}

/**
 * The one line that says what to do with this buyer. A buyer on no property
 * is the whole reason this page exists, so that case speaks loudest.
 */
function statusLine(buyer: BuyerRow): { text: string; tone: "urgent" | "muted" | "brand" } {
    if (buyer.liveDealCount === 0) {
        return { text: "Not on any property yet.", tone: "urgent" };
    }

    if (buyer.activePropertyTitles.length === 1) {
        return { text: buyer.activePropertyTitles[0], tone: "muted" };
    }

    return {
        text: `On ${buyer.liveDealCount} properties`,
        tone: "muted",
    };
}

export function BuyerCard({ buyer }: { buyer: BuyerRow }) {
    const budget = budgetLabel(buyer);
    const status = statusLine(buyer);
    const LookingIcon = buyer.lookingFor === "rent" ? KeyRound : Home;

    return (
        <article
            className="
              flex flex-col gap-3 rounded-card border border-border-warm bg-surface p-4
              transition-[box-shadow,border-color] duration-160
              hover:border-ink/15 hover:shadow-md
            "
            aria-label={buyer.name}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 min-inline-0">
                    <UserAvatar name={buyer.name} size="md" />

                    <div className="min-inline-0">
                        <div className="flex items-center gap-1.5">
                            <span className="body-sm truncate font-semibold text-ink">
                                {buyer.name}
                            </span>
                            {buyer.closedDealCount > 0 ? (
                                <Tooltip>
                                    <TooltipTrigger
                                        render={
                                            <span className="
                                              flex shrink-0 items-center text-success
                                            ">
                                                <TrendingUp
                                                    aria-hidden
                                                    className="block-3.5 inline-3.5"
                                                    strokeWidth={2}
                                                />
                                            </span>
                                        }
                                    />
                                    <TooltipContent>
                                        You have closed {buyer.closedDealCount}{" "}
                                        {buyer.closedDealCount === 1 ? "deal" : "deals"} with this
                                        buyer.
                                    </TooltipContent>
                                </Tooltip>
                            ) : null}
                        </div>
                        <PhoneNumber
                            phoneDigits={buyer.phoneDigits}
                            className="body-xs text-ink-muted"
                        />
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                    <ChatButton
                        size="icon-xs"
                        peer={{
                            id: buyer.id,
                            name: buyer.name,
                            roleLabel: "Buyer",
                            isOnline: false,
                        }}
                    />
                    <Tooltip>
                        <TooltipTrigger
                            render={
                                <Button
                                    variant="outline"
                                    size="icon-xs"
                                    nativeButton={false}
                                    className="shrink-0 border-border-warm text-brand"
                                    render={
                                        <a
                                            href={formatWhatsAppUrl(buyer.phoneDigits)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            aria-label={`Message ${buyer.name} on WhatsApp`}
                                        />
                                    }
                                />
                            }
                        >
                            <MessageCircle aria-hidden strokeWidth={1.75} />
                        </TooltipTrigger>
                        <TooltipContent>Message {buyer.name} on WhatsApp.</TooltipContent>
                    </Tooltip>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="neutral" className="gap-1">
                    <LookingIcon aria-hidden className="block-3 inline-3" strokeWidth={2} />
                    {buyer.lookingFor === "rent" ? "Renting" : "Buying"}
                </Badge>
                {buyer.bhk !== null ? (
                    <Badge variant="neutral">{buyer.bhk} BHK</Badge>
                ) : null}
                {budget ? (
                    <Badge variant="neutral" className="tabular">
                        {budget}
                    </Badge>
                ) : null}
            </div>

            <p className="body-xs flex items-start gap-1.5 text-ink-muted">
                <MapPin
                    aria-hidden
                    className="mbs-px shrink-0 block-3.5 inline-3.5"
                    strokeWidth={1.75}
                />
                <span className="text-pretty">{buyer.preferredLocalities.join(", ")}</span>
            </p>

            {buyer.documents.length > 0 ? (
                <details className="group/docs">
                    <summary
                        className="
                          body-xs flex cursor-pointer list-none items-center gap-1.5 text-ink-muted
                          hover:text-ink
                        "
                    >
                        <Paperclip
                            aria-hidden
                            className="shrink-0 block-3.5 inline-3.5"
                            strokeWidth={1.75}
                        />
                        {buyer.documents.length}{" "}
                        {buyer.documents.length === 1 ? "document" : "documents"}
                    </summary>

                    <ul className="mbs-2 flex flex-col gap-1.5">
                        {buyer.documents.map((doc) => {
                            const DocIcon = documentIcon(doc.mimeType);
                            return (
                                <li key={doc.id}>
                                    <a
                                        href={doc.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="
                                          flex items-center gap-2 rounded-inner bg-surface-muted/60
                                          px-2.5 py-2 transition-colors duration-160
                                          hover:bg-surface-muted
                                        "
                                    >
                                        <DocIcon
                                            aria-hidden
                                            className="shrink-0 text-ink-muted block-4 inline-4"
                                            strokeWidth={1.75}
                                        />
                                        <span className="
                                          body-xs flex-1 truncate text-ink min-inline-0
                                        ">
                                            {doc.fileName}
                                        </span>
                                        <span className="body-xs shrink-0 text-ink-subtle">
                                            {BUYER_DOCUMENT_KIND_LABEL[doc.kind]} ·{" "}
                                            <span className="tabular">
                                                {formatFileSize(doc.sizeBytes)}
                                            </span>
                                        </span>
                                    </a>
                                </li>
                            );
                        })}
                    </ul>
                </details>
            ) : null}

            <div className="
              flex flex-wrap items-center justify-between gap-2 border-bs border-border-warm pbs-3
            ">
                <p
                    className={cn(
                        "body-xs",
                        status.tone === "urgent" && "text-urgent",
                        status.tone === "brand" && "text-brand-text",
                        status.tone === "muted" && "text-ink-muted",
                    )}
                >
                    {status.text}
                </p>

                <p className="body-xs text-ink-subtle">
                    {buyer.lastContactedAt
                        ? `Spoke ${formatRelativePast(new Date(buyer.lastContactedAt), new Date())}`
                        : "Never contacted"}
                </p>
            </div>
        </article>
    );
}
