"use client";

import { useEffect, useState } from "react";

import { formatInTimeZone } from "date-fns-tz";
import { CalendarPlus, CircleHelp, Clock3 } from "lucide-react";

import { Button } from "@/components/ui/button";

const IST = "Asia/Kolkata";

export function BrokerVisitsHeader({
    onBook,
    onRequest,
}: {
    onBook: () => void;
    onRequest: () => void;
}) {
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        const timer = window.setInterval(() => setNow(new Date()), 30_000);
        return () => window.clearInterval(timer);
    }, []);

    return (
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
                <h1 className="h1 text-ink">Site visits</h1>
                <span className="
                  body-xs tabular flex items-center gap-1.5 rounded-md border border-border-warm
                  bg-surface px-2.5 py-1.5 font-semibold text-ink-muted
                ">
                    <Clock3 aria-hidden className="block-3.5 inline-3.5" />
                    {formatInTimeZone(now, IST, "EEE, d MMM · h:mm a")}
                    <span className="sr-only">India Standard Time</span>
                </span>
            </div>

            <div className="grid grid-cols-[1fr_1fr_auto] gap-2 sm:flex sm:flex-row-reverse">
                <Button size="md" onClick={onBook}>
                    <CalendarPlus aria-hidden /> Book a visit
                </Button>
                <Button variant="surface" size="md" onClick={onRequest}>
                    Request a time
                </Button>
                <details className="relative"><summary className="
                  grid cursor-pointer list-none place-items-center rounded-control border
                  border-border-warm bg-surface text-ink-muted block-11 inline-11 min-block-11
                  hover:text-ink
                  focus-visible:ring-3 focus-visible:ring-brand/25
                "><CircleHelp aria-hidden className="block-4 inline-4" /><span className="sr-only">Keyboard shortcuts</span></summary><div className="
                  body-xs absolute inset-e-0 z-40 mbs-2 rounded-card bg-brand-ink p-4 text-surface
                  shadow-lg inline-64
                "><p className="font-bold">Keyboard shortcuts</p><dl className="
                  mbs-2 grid grid-cols-[40px_1fr] gap-y-2 text-surface/75
                "><dt>/</dt><dd>Search open slots</dd><dt>T</dt><dd>Jump to today</dd><dt>[ ]</dt><dd>Previous or next day</dd><dt>B</dt><dd>Book focused slot</dd><dt>Esc</dt><dd>Close a panel</dd></dl></div></details>
            </div>
        </header>
    );
}
