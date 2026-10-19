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
    InviteStageFilter,
} from "@/features/properties/my-requests/invite-types";
import type { RequestsTab } from "@/features/properties/my-requests/requests-tabs";
import type {
    DealListingType,
    RequestsFilters,
    RequestSort,
    RequestsSummary,
    RequestsViewFilter,
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

type SentStatusChip = {
    key: Exclude<RequestsViewFilter, "all" | "declined" | "cancelled" | "locked" | "not_opened">;
    label: string;
    mobileLabel: string;
    description: string;
};

const SENT_STATUS_CHIPS: SentStatusChip[] = [
    {
        key: "pending",
        label: "Waiting",
        mobileLabel: "Waiting",
        description: "Requests the owner has not replied to yet",
    },
    {
        key: "approved",
        label: "Accepted",
        mobileLabel: "Accepted",
        description: "Requests the owner accepted — you can sell these",
    },
    {
        key: "needs_buyer",
        label: "Needs a buyer",
        mobileLabel: "Buyer",
        description: "Accepted requests where you have not added a buyer yet",
    },
];

type InviteStatusChip = {
    key: Exclude<InviteStageFilter, "all" | "expired">;
    label: string;
    mobileLabel: string;
    description: string;
};

const INVITE_STATUS_CHIPS: InviteStatusChip[] = [
    {
        key: "pending",
        label: "Waiting on you",
        mobileLabel: "Waiting",
        description: "Owners waiting for you to say yes or no",
    },
    {
        key: "accepted",
        label: "Accepted",
        mobileLabel: "Accepted",
        description: "Invites you took — you can sell these",
    },
    {
        key: "declined",
        label: "Turned down",
        mobileLabel: "No",
        description: "Invites you said no to",
    },
];

function sentChipCount(summary: RequestsSummary | null, key: SentStatusChip["key"]): number {
    if (!summary) return 0;
    if (key === "needs_buyer") return summary.needsFollowUpCount;
    return summary.counts[key];
}

function inviteChipCount(summary: InvitesSummary | null, key: InviteStatusChip["key"]): number {
    if (!summary) return 0;
    return summary.counts[key];
}

function countSentSheetFilters(filters: RequestsFilters): number {
    let count = 0;
    if (filters.type) count += 1;
    if (filters.view !== "all") count += 1;
    return count;
}

function countInviteSheetFilters(filters: InvitesFilters): number {
    let count = 0;
    if (filters.type) count += 1;
    if (filters.stage !== "all") count += 1;
    return count;
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
                    <div className="flex flex-col gap-2">
                        <p className="body-sm font-semibold text-ink">Status</p>
                        <div className="flex flex-wrap gap-2">
                            {(
                                [
                                    ["all", "Any"],
                                    ["pending", "Waiting"],
                                    ["approved", "Accepted"],
                                    ["needs_buyer", "Needs a buyer"],
                                    ["declined", "Rejected"],
                                    ["cancelled", "Cancelled"],
                                    ["locked", "No more attempts"],
                                    ["not_opened", "Not opened yet"],
                                ] as const
                            ).map(([value, label]) => (
                                <button
                                    key={value}
                                    type="button"
                                    className={ownerListingsChipClassName(draft.view === value)}
                                    onClick={() => setDraft({ ...draft, view: value })}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="border-bs border-border-warm/40 bg-surface px-5 py-4">
                    <AppModalFooter
                        secondaryLabel="Reset filter"
                        onSecondary={() => setDraft({ ...draft, type: "", view: "all" })}
                        primaryLabel="Apply filters"
                        onPrimary={() => {
                            onApply({ type: draft.type, view: draft.view, page: 1 });
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
                    <div className="flex flex-col gap-2">
                        <p className="body-sm font-semibold text-ink">Status</p>
                        <div className="flex flex-wrap gap-2">
                            {(
                                [
                                    ["all", "Any"],
                                    ["pending", "Waiting on you"],
                                    ["accepted", "Accepted"],
                                    ["declined", "Turned down"],
                                    ["expired", "Closed"],
                                ] as const
                            ).map(([value, label]) => (
                                <button
                                    key={value}
                                    type="button"
                                    className={ownerListingsChipClassName(draft.stage === value)}
                                    onClick={() => setDraft({ ...draft, stage: value })}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="border-bs border-border-warm/40 bg-surface px-5 py-4">
                    <AppModalFooter
                        secondaryLabel="Reset filter"
                        onSecondary={() => setDraft({ ...draft, type: "", stage: "all" })}
                        primaryLabel="Apply filters"
                        onPrimary={() => {
                            onApply({ type: draft.type, stage: draft.stage, page: 1 });
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
    const isInvites = activeTab === "invites";
    const sheetFilterCount = useMemo(
        () =>
            isInvites ? countInviteSheetFilters(inviteFilters) : countSentSheetFilters(sentFilters),
        [inviteFilters, isInvites, sentFilters],
    );

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
                                    onClear={() => {
                                        if (isInvites) {
                                            onPatchInvites({ type: "", stage: "all", page: 1 });
                                        } else {
                                            onPatchSent({ type: "", view: "all", page: 1 });
                                        }
                                    }}
                                    description="Sale/rent and status filters"
                                />
                            </OwnerListingsChipsCarouselSlide>

                            <OwnerListingsChipsCarouselSlide>
                                <Tooltip>
                                    <TooltipTrigger
                                        render={
                                            <Link
                                                href={BROKER_MY_DEALS_HREF}
                                                aria-current={!isInvites ? "page" : undefined}
                                                className={ownerListingsChipClassName(!isInvites)}
                                            >
                                                <span className="md:hidden">Sent</span>
                                                <span className="hidden md:inline">
                                                    Sent by you
                                                </span>
                                                <FilterChipCount
                                                    count={sentSummary?.counts.all ?? 0}
                                                    isActive={!isInvites}
                                                    isLoading={isLoading && !sentSummary}
                                                />
                                            </Link>
                                        }
                                    />
                                    <TooltipContent side="bottom">
                                        Requests you sent to owners
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
                                                    Invites from owners
                                                </span>
                                                <FilterChipCount
                                                    count={inviteSummary?.counts.all ?? 0}
                                                    isActive={isInvites}
                                                    isLoading={isLoading && !inviteSummary}
                                                />
                                                {(inviteSummary?.waitingOnYouCount ?? 0) > 0 ? (
                                                    <span
                                                        aria-label={`${inviteSummary?.waitingOnYouCount} waiting for you`}
                                                        className="
                                                          body-xs flex items-center justify-center
                                                          rounded-md bg-urgent px-1 font-semibold
                                                          text-surface block-5 min-inline-5
                                                        "
                                                    >
                                                        {inviteSummary?.waitingOnYouCount}
                                                    </span>
                                                ) : null}
                                            </Link>
                                        }
                                    />
                                    <TooltipContent side="bottom">
                                        Invites owners sent you
                                    </TooltipContent>
                                </Tooltip>
                            </OwnerListingsChipsCarouselSlide>

                            {isInvites
                                ? INVITE_STATUS_CHIPS.map((chip) => {
                                      const active = inviteFilters.stage === chip.key;
                                      return (
                                          <OwnerListingsChipsCarouselSlide key={chip.key}>
                                              <FilterChip
                                                  label={chip.label}
                                                  mobileLabel={chip.mobileLabel}
                                                  count={inviteChipCount(inviteSummary, chip.key)}
                                                  isLoading={isLoading}
                                                  isActive={active}
                                                  clearable
                                                  onClick={() =>
                                                      onPatchInvites({
                                                          stage: active ? "all" : chip.key,
                                                      })
                                                  }
                                                  description={chip.description}
                                              />
                                          </OwnerListingsChipsCarouselSlide>
                                      );
                                  })
                                : SENT_STATUS_CHIPS.map((chip) => {
                                      const active = sentFilters.view === chip.key;
                                      return (
                                          <OwnerListingsChipsCarouselSlide key={chip.key}>
                                              <FilterChip
                                                  label={chip.label}
                                                  mobileLabel={chip.mobileLabel}
                                                  count={sentChipCount(sentSummary, chip.key)}
                                                  isLoading={isLoading}
                                                  isActive={active}
                                                  clearable
                                                  onClick={() =>
                                                      onPatchSent({
                                                          view: active ? "all" : chip.key,
                                                      })
                                                  }
                                                  description={chip.description}
                                              />
                                          </OwnerListingsChipsCarouselSlide>
                                      );
                                  })}
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
