import Link from "next/link";

import { Building2 } from "lucide-react";

import { cn } from "@/lib/utils";

import { Price } from "@/components/shared/price";
import { Button } from "@/components/ui/button";

import { CardLabel } from "./card-label";
import { DASHBOARD_CARD_SHELL } from "./card-shell";
import type { RepresentedPropertyItem, YouRepresentData } from "./mock-data";

const YOU_REPRESENT_INFO =
    "Properties owners have approved you to represent — share them with buyers and tenants.";

export type YouRepresentCardProps = {
    data: YouRepresentData;
    className?: string;
};

function PropertyRow({
    property,
    className,
}: {
    property: RepresentedPropertyItem;
    className?: string;
}) {
    return (
        <li className={cn("flex items-center gap-3 md:gap-4", className)}>
            <span
                className="
                  flex shrink-0 items-center justify-center rounded-inner bg-surface-muted
                  text-ink-muted block-12 inline-12
                "
                aria-hidden
            >
                <Building2 className="block-5 inline-5" strokeWidth={1.75} />
            </span>

            <div className="flex-1 min-inline-0">
                <p className="body font-semibold text-ink">
                    {property.configLabel} · {property.locality} ·{" "}
                    <Price
                        amountInr={property.amountInr}
                        isRent={property.isRent}
                        className="font-semibold"
                    />
                </p>
                <p
                    className={cn(
                        "body-sm mbs-0.5",
                        property.isStale ? "font-medium text-urgent" : "text-ink-muted",
                    )}
                >
                    {property.statusLabel}
                </p>
            </div>

            <Button
                variant="outline"
                size="sm"
                nativeButton={false}
                render={<Link href={`/broker/properties/${property.id}?share=1`} />}
                className="shrink-0 border-2 border-border-warm"
            >
                Share
            </Button>
        </li>
    );
}

export function YouRepresentCard({ data, className }: YouRepresentCardProps) {
    const { totalCount, properties } = data;
    const heading =
        totalCount === 1 ? "You represent 1" : `You represent ${totalCount}`;

    return (
        <section
            className={cn(DASHBOARD_CARD_SHELL, className)}
            aria-labelledby="you-represent-heading"
        >
            <div className="flex shrink-0 items-center justify-between gap-3">
                <CardLabel info={YOU_REPRESENT_INFO}>
                    <span id="you-represent-heading">{heading}</span>
                </CardLabel>
                <Button
                    variant="link"
                    size="sm"
                    nativeButton={false}
                    render={<Link href="/broker/properties?mine=1" />}
                    className="body-sm p-0 font-semibold text-brand block-auto"
                >
                    View all
                </Button>
            </div>

            {properties.length === 0 ? (
                <div className="mbs-4 flex flex-1 flex-col min-block-0">
                    <p className="h5 text-ink">No properties yet.</p>
                    <p className="body mbs-1 text-ink-muted">
                        When an owner approves your request, it shows up here.
                    </p>
                    <div className="pts-3 mbs-auto">
                        <Button
                            variant="link"
                            size="sm"
                            nativeButton={false}
                            render={<Link href="/broker/properties" />}
                            className="body-sm p-0 font-semibold text-brand block-auto"
                        >
                            Browse available properties
                            <span aria-hidden>→</span>
                        </Button>
                    </div>
                </div>
            ) : (
                <ul className="mbs-1 flex flex-1 flex-col min-block-0">
                    {properties.map((property, index) => (
                        <PropertyRow
                            key={property.id}
                            property={property}
                            className={
                                index > 0
                                    ? "mbs-3 border-bs border-border-warm pbs-3"
                                    : "mbs-4"
                            }
                        />
                    ))}
                </ul>
            )}
        </section>
    );
}
