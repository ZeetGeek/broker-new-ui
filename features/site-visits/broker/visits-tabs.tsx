"use client";

import { CalendarDays, CalendarPlus, CircleHelp, ClockArrowUp, MessageSquareText } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverDescription,
    PopoverHeader,
    PopoverTitle,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import type { BrokerVisitsTab } from "@/features/site-visits/broker/model";

const TABS = [
    { value: "visits", label: "My visits", icon: CalendarDays },
    { value: "slots", label: "Open slots", icon: ClockArrowUp },
    { value: "requests", label: "Requests", icon: MessageSquareText },
] as const;

export function VisitsTabs({
    value,
    counts,
    onChange,
    onBook,
    onRequest,
}: {
    value: BrokerVisitsTab;
    counts: Record<BrokerVisitsTab, number>;
    onChange: (tab: BrokerVisitsTab) => void;
    onBook: () => void;
    onRequest: () => void;
}) {
    return (
        <div className="sticky inset-bs-0 z-30 flex flex-col gap-2 rounded-card border border-border-warm bg-surface p-2 shadow-sm lg:flex-row lg:items-center lg:justify-between">
            <Tabs value={value} onValueChange={(next) => onChange(next as BrokerVisitsTab)} className="min-inline-0">
                <TabsList className="grid grid-cols-3 bg-surface-muted p-1 block-auto! inline-full lg:inline-fit">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <TabsTrigger
                                key={tab.value}
                                value={tab.value}
                                className="body-sm rounded-control px-3 text-ink-muted block-control-lg! data-active:border-border-warm! data-active:bg-surface data-active:text-ink data-active:shadow-sm after:hidden!"
                            >
                                <Icon aria-hidden className="hidden sm:block" strokeWidth={1.75} />
                                <span>{tab.label}</span>
                                <span className="body-xs tabular-nums rounded-md bg-canvas px-1.5 py-0.5 text-ink-muted">
                                    {counts[tab.value]}
                                </span>
                            </TabsTrigger>
                        );
                    })}
                </TabsList>
            </Tabs>

            <TooltipProvider>
                <div className="grid grid-cols-[1fr_1fr_auto] gap-2 lg:flex lg:items-center">
                    <Button variant="surface" size="md" onClick={onRequest}>
                        Request a time
                    </Button>
                    <Button size="md" onClick={onBook}>
                        <CalendarPlus aria-hidden />
                        Book a visit
                    </Button>
                    <Popover>
                        <Tooltip>
                            <TooltipTrigger
                                render={
                                    <PopoverTrigger
                                        render={
                                            <Button type="button" variant="ghost" size="icon-md" aria-label="Keyboard shortcuts">
                                                <CircleHelp aria-hidden />
                                            </Button>
                                        }
                                    />
                                }
                            />
                            <TooltipContent side="bottom">Keyboard shortcuts</TooltipContent>
                        </Tooltip>
                        <PopoverContent align="end" side="bottom" className="gap-3 p-4 inline-72">
                            <PopoverHeader>
                                <PopoverTitle>Keyboard shortcuts</PopoverTitle>
                                <PopoverDescription>Move through the schedule without leaving the keyboard.</PopoverDescription>
                            </PopoverHeader>
                            <dl className="body-xs grid grid-cols-[44px_1fr] gap-y-2 text-ink-muted">
                                <dt className="font-semibold text-ink">/</dt><dd>Search open slots</dd>
                                <dt className="font-semibold text-ink">T</dt><dd>Jump to today</dd>
                                <dt className="font-semibold text-ink">[ ]</dt><dd>Previous or next day</dd>
                                <dt className="font-semibold text-ink">B</dt><dd>Book the focused slot</dd>
                                <dt className="font-semibold text-ink">Esc</dt><dd>Close an open panel</dd>
                            </dl>
                        </PopoverContent>
                    </Popover>
                </div>
            </TooltipProvider>
        </div>
    );
}
