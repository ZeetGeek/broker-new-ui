"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { ArrowDownUp, ChevronDown, Search, SlidersHorizontal } from "lucide-react";

import { BROKER_MY_DEALS_HREF } from "@/lib/routes/broker";
import { cn } from "@/lib/utils";

import { AppModalFooter } from "@/components/shared/app-modal-footer";
import { FilterChip, FilterChipCount } from "@/components/shared/filter-chip";
import {
    Dialog,
    DialogClose,
    DialogHeader,
    DialogPopup,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import type {
    InvitesFilters,
    InviteSort,
    InvitesSummary,
} from "@/features/properties/my-requests/invite-types";
import type { RequestsTab } from "@/features/properties/my-requests/requests-tabs";
import type {
    DealListingType,
    RequestsFilters,
    RequestSort,
    RequestsSummary,
} from "@/features/properties/my-requests/types";
import { ownerListingsChipClassName } from "@/features/properties/owner-listings/owner-listings-chip-styles";
import {
    OwnerListingsChipsCarousel,
    OwnerListingsChipsCarouselSlide,
} from "@/features/properties/owner-listings/owner-listings-chips-carousel";

const SENT_SORT_OPTIONS: { value: RequestSort; label: string }[] = [
    { value: "recent", label: "Newest first" },
    { value: "oldest", label: "Oldest first" },
    { value: "waiting_longest", label: "Waiting longest" },
    { value: "price_desc", label: "Price high" },
    { value: "price_asc", label: "Price low" },
];

const INVITE_SORT_OPTIONS: { value: InviteSort; label: string }[] = [
    { value: "recent", label: "Newest first" },
    { value: "oldest", label: "Oldest first" },
    { value: "price_desc", label: "Price high" },
    { value: "price_asc", label: "Price low" },
];

function countTypeFilter(type: DealListingType): number {
    return type ? 1 : 0;
}

function DealsQueryInput({ value, onChange }: { value: string; onChange: (q: string) => void }) {
    const [draft, setDraft] = useState(value);
    const [prevValue, setPrevValue] = useState(value);

    if (value !== prevValue) {
        setPrevValue(value);
        setDraft(value);
    }

    useEffect(() => {
        if (draft === value) return;
        const timer = window.setTimeout(() => onChange(draft), 300);
        return () => window.clearTimeout(timer);
    }, [draft, onChange, value]);

    return (
        <Input
            size="sm"
            value={draft}
            onValueChange={setDraft}
            placeholder="Search deals"
            aria-label="Search your deals"
            startIcon={Search}
            clearable
            wrapperClassName="
              min-inline-44 inline-44 shadow-sm
              sm:min-inline-52 sm:inline-52
              lg:min-inline-64 lg:inline-64
            "
            className="
              rounded-control border! border-border-warm bg-surface text-sm font-medium shadow-sm
              block-[38px]!
              hover:border-ink/25!
              focus-visible:border-ring! focus-visible:ring-2 focus-visible:ring-ring/20
            "
        />
    );
}

function DealsSortMenu({
    sort,
    options,
    onSortChange,
}: {
    sort: string;
    options: { value: string; label: string }[];
    onSortChange: (sort: string) => void;
}) {
    const isDefaultSort = sort === "recent";
    const label = options.find((option) => option.value === sort)?.label ?? "Newest first";

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={
                    <button
                        type="button"
                        className={cn(
                            ownerListingsChipClassName(!isDefaultSort),
                            "gap-2",
                            isDefaultSort && "text-ink-muted",
                        )}
                    >
                        <ArrowDownUp
                            aria-hidden
                            className="text-brand block-4 inline-4"
                            strokeWidth={1.75}
                        />
                        <span className="hidden sm:inline">{label}</span>
                        <span className="sm:hidden">Sort</span>
                        <ChevronDown
                            aria-hidden
                            className="opacity-60 block-3.5 inline-3.5"
                            strokeWidth={1.75}
                        />
                    </button>
                }
            />
            <DropdownMenuContent align="end" className="min-inline-44">
                {options.map((option) => (
                    <DropdownMenuItem
                        key={option.value}
                        onClick={() => onSortChange(option.value)}
                        className={cn(sort === option.value && "font-semibold text-brand")}
                    >
                        {option.label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function LookingForRow({
    type,
    onChange,
}: {
    type: DealListingType;
    onChange: (type: DealListingType) => void;
}) {
    return (
        <div className="flex flex-col gap-2">
            <p className="body-sm font-semibold text-ink">Looking for</p>
            <div className="flex flex-wrap gap-2">
                {(
                    [
                        ["", "Any"],
                        ["sale", "Sale"],
                        ["rent", "Rent"],
                    ] as const
                ).map(([value, label]) => (
                    <button
                        key={value || "any"}
                        type="button"
                        className={ownerListingsChipClassName(type === value)}
                        onClick={() => onChange(value)}
                    >
                        {label}
                    </button>
                ))}
            </div>
        </div>
    );
}

function SentFilterDialog({
    open,
    onOpenChange,
    filters,
    onApply,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    filters: RequestsFilters;
    onApply: (next: Partial<RequestsFilters>) => void;
}) {
    const [draft, setDraft] = useState(filters);
    const [wasOpen, setWasOpen] = useState(open);
    const [syncedFilters, setSyncedFilters] = useState(filters);

    if (open) {
        if (!wasOpen || filters !== syncedFilters) {
            setWasOpen(true);
            setSyncedFilters(filters);
            setDraft(filters);
        }
    } else if (wasOpen) {
        setWasOpen(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogPopup className="gap-0 p-0 max-inline-lg sm:max-inline-lg">
                <DialogHeader className="border-be border-border-warm px-5 py-4">
                    <DialogTitle>Filters</DialogTitle>
                    <DialogClose />
                </DialogHeader>
                <div className="flex flex-col gap-5 p-5">
                    <LookingForRow
                        type={draft.type}
                        onChange={(type) => setDraft({ ...draft, type })}
                    />
                </div>
                <div className="border-bs border-border-warm/40 bg-surface px-5 py-4">
                    <AppModalFooter
                        secondaryLabel="Reset filter"
                        onSecondary={() => setDraft({ ...draft, type: "" })}
                        primaryLabel="Apply filters"
                        onPrimary={() => {
                            onApply({ type: draft.type, page: 1 });
                            onOpenChange(false);
                        }}
                    />
                </div>
            </DialogPopup>
        </Dialog>
    );
}

function InviteFilterDialog({
    open,
    onOpenChange,
    filters,
    onApply,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    filters: InvitesFilters;
    onApply: (next: Partial<InvitesFilters>) => void;
}) {
    const [draft, setDraft] = useState(filters);
    const [wasOpen, setWasOpen] = useState(open);
    const [syncedFilters, setSyncedFilters] = useState(filters);

    if (open) {
        if (!wasOpen || filters !== syncedFilters) {
            setWasOpen(true);
            setSyncedFilters(filters);
            setDraft(filters);
        }
    } else if (wasOpen) {
        setWasOpen(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogPopup className="gap-0 p-0 max-inline-lg sm:max-inline-lg">
                <DialogHeader className="border-be border-border-warm px-5 py-4">
                    <DialogTitle>Filters</DialogTitle>
                    <DialogClose />
                </DialogHeader>
                <div className="flex flex-col gap-5 p-5">
                    <LookingForRow
                        type={draft.type}
                        onChange={(type) => setDraft({ ...draft, type })}
                    />
                </div>
                <div className="border-bs border-border-warm/40 bg-surface px-5 py-4">
                    <AppModalFooter
                        secondaryLabel="Reset filter"
                        onSecondary={() => setDraft({ ...draft, type: "" })}
                        primaryLabel="Apply filters"
                        onPrimary={() => {
                            onApply({ type: draft.type, page: 1 });
                            onOpenChange(false);
                        }}
                    />
                </div>
            </DialogPopup>
        </Dialog>
    );
}

export type MyDealsHeaderProps = {
    activeTab: RequestsTab;
    sentSummary: RequestsSummary | null;
    inviteSummary: InvitesSummary | null;
    sentFilters: RequestsFilters;
    inviteFilters: InvitesFilters;
    onPatchSent: (patch: Partial<RequestsFilters>) => void;
    onPatchInvites: (patch: Partial<InvitesFilters>) => void;
    isLoading?: boolean;
};

export function MyDealsHeader({
    activeTab,
    sentSummary,
    inviteSummary,
    sentFilters,
    inviteFilters,
    onPatchSent,
    onPatchInvites,
    isLoading = false,
}: MyDealsHeaderProps) {
    const [sheetOpen, setSheetOpen] = useState(false);
    const isSent = activeTab === "sent";
    const isInvites = activeTab === "invites";
    const isAccepted = activeTab === "accepted";
    const isRejected = activeTab === "rejected";

    const sheetFilterCount = useMemo(() => {
        if (isInvites) return countTypeFilter(inviteFilters.type);
        return countTypeFilter(sentFilters.type);
    }, [inviteFilters.type, isInvites, sentFilters.type]);

    const sentWaitingCount = sentSummary?.counts.pending ?? 0;
    const inviteWaitingCount = inviteSummary?.waitingOnYouCount ?? 0;
    const acceptedCount =
        (sentSummary?.counts.approved ?? 0) + (inviteSummary?.counts.accepted ?? 0);
    const rejectedCount =
        (sentSummary?.counts.declined ?? 0) + (inviteSummary?.counts.declined ?? 0);

    const clearType = () => {
        if (isInvites) {
            onPatchInvites({ type: "", page: 1 });
        } else {
            onPatchSent({ type: "", page: 1 });
        }
    };

    return (
        <>
            <div className="sticky inset-bs-0 z-10">
                <TooltipProvider>
                    <div className="flex items-center justify-between gap-3 sm:gap-4">
                        <OwnerListingsChipsCarousel>
                            <OwnerListingsChipsCarouselSlide>
                                <FilterChip
                                    label="Filters"
                                    icon={SlidersHorizontal}
                                    count={sheetFilterCount}
                                    isLoading={isLoading}
                                    isActive={sheetFilterCount > 0}
                                    clearable={sheetFilterCount > 0}
                                    onClick={() => setSheetOpen(true)}
                                    onClear={clearType}
                                    description="Sale or rent"
                                />
                            </OwnerListingsChipsCarouselSlide>

                            <OwnerListingsChipsCarouselSlide>
                                <Tooltip>
                                    <TooltipTrigger
                                        render={
                                            <Link
                                                href={BROKER_MY_DEALS_HREF}
                                                aria-current={isSent ? "page" : undefined}
                                                className={ownerListingsChipClassName(isSent)}
                                            >
                                                <span className="md:hidden">Sent</span>
                                                <span className="hidden md:inline">
                                                    Sent by you
                                                </span>
                                                <FilterChipCount
                                                    count={sentWaitingCount}
                                                    isActive={isSent}
                                                    isLoading={isLoading && !sentSummary}
                                                />
                                            </Link>
                                        }
                                    />
                                    <TooltipContent side="bottom">
                                        Requests you sent that are still waiting
                                    </TooltipContent>
                                </Tooltip>
                            </OwnerListingsChipsCarouselSlide>

                            <OwnerListingsChipsCarouselSlide>
                                <Tooltip>
                                    <TooltipTrigger
                                        render={
                                            <Link
                                                href={`${BROKER_MY_DEALS_HREF}?tab=invites`}
                                                aria-current={isInvites ? "page" : undefined}
                                                className={cn(
                                                    ownerListingsChipClassName(isInvites),
                                                    "gap-2",
                                                )}
                                            >
                                                <span className="md:hidden">Invites</span>
                                                <span className="hidden md:inline">
                                                    Owner invitations
                                                </span>
                                                <FilterChipCount
                                                    count={inviteWaitingCount}
                                                    isActive={isInvites}
                                                    isLoading={isLoading && !inviteSummary}
                                                />
                                            </Link>
                                        }
                                    />
                                    <TooltipContent side="bottom">
                                        Owner invites waiting for your answer
                                    </TooltipContent>
                                </Tooltip>
                            </OwnerListingsChipsCarouselSlide>

                            <OwnerListingsChipsCarouselSlide>
                                <Tooltip>
                                    <TooltipTrigger
                                        render={
                                            <Link
                                                href={`${BROKER_MY_DEALS_HREF}?tab=accepted`}
                                                aria-current={isAccepted ? "page" : undefined}
                                                className={ownerListingsChipClassName(isAccepted)}
                                            >
                                                Accepted
                                                <FilterChipCount
                                                    count={acceptedCount}
                                                    isActive={isAccepted}
                                                    isLoading={
                                                        isLoading && !sentSummary && !inviteSummary
                                                    }
                                                />
                                            </Link>
                                        }
                                    />
                                    <TooltipContent side="bottom">
                                        Accepted requests and invites you can sell
                                    </TooltipContent>
                                </Tooltip>
                            </OwnerListingsChipsCarouselSlide>

                            <OwnerListingsChipsCarouselSlide>
                                <Tooltip>
                                    <TooltipTrigger
                                        render={
                                            <Link
                                                href={`${BROKER_MY_DEALS_HREF}?tab=rejected`}
                                                aria-current={isRejected ? "page" : undefined}
                                                className={ownerListingsChipClassName(isRejected)}
                                            >
                                                Rejected
                                                <FilterChipCount
                                                    count={rejectedCount}
                                                    isActive={isRejected}
                                                    isLoading={
                                                        isLoading && !sentSummary && !inviteSummary
                                                    }
                                                />
                                            </Link>
                                        }
                                    />
                                    <TooltipContent side="bottom">
                                        Owner rejections and invites you turned down
                                    </TooltipContent>
                                </Tooltip>
                            </OwnerListingsChipsCarouselSlide>
                        </OwnerListingsChipsCarousel>

                        <div className="flex shrink-0 items-center gap-2.5">
                            {isInvites ? (
                                <DealsQueryInput
                                    value={inviteFilters.q}
                                    onChange={(q) => onPatchInvites({ q })}
                                />
                            ) : (
                                <DealsQueryInput
                                    value={sentFilters.q}
                                    onChange={(q) => onPatchSent({ q })}
                                />
                            )}
                            {isInvites ? (
                                <DealsSortMenu
                                    sort={inviteFilters.sort}
                                    options={INVITE_SORT_OPTIONS}
                                    onSortChange={(sort) =>
                                        onPatchInvites({ sort: sort as InviteSort })
                                    }
                                />
                            ) : (
                                <DealsSortMenu
                                    sort={sentFilters.sort}
                                    options={SENT_SORT_OPTIONS}
                                    onSortChange={(sort) =>
                                        onPatchSent({ sort: sort as RequestSort })
                                    }
                                />
                            )}
                        </div>
                    </div>
                </TooltipProvider>
            </div>

            {isInvites ? (
                <InviteFilterDialog
                    open={sheetOpen}
                    onOpenChange={setSheetOpen}
                    filters={inviteFilters}
                    onApply={onPatchInvites}
                />
            ) : (
                <SentFilterDialog
                    open={sheetOpen}
                    onOpenChange={setSheetOpen}
                    filters={sentFilters}
                    onApply={onPatchSent}
                />
            )}
        </>
    );
}
