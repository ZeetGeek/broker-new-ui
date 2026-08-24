import Link from "next/link";

import { Building2 } from "lucide-react";

import { cn } from "@/lib/utils";

import { Price } from "@/components/shared/price";
import { Button } from "@/components/ui/button";

import type { AreaPropertyItem } from "./mock-data";

export type NewInAreasProps = {
    properties: AreaPropertyItem[];
    className?: string;
};

export function NewInAreas({ properties, className }: NewInAreasProps) {
    return (
        <section className={cn("flex flex-col gap-3", className)}>
            <div className="flex items-center justify-between gap-3 px-1">
                <h2 className="h5 text-ink-muted">New in your areas</h2>
                <Button
                    variant="link"
                    size="sm"
                    nativeButton={false}
                    render={<Link href="/broker/properties" />}
                    className="body-sm p-0 font-semibold text-brand block-auto"
                >
                    Browse all
                </Button>
            </div>

            <ul className="flex flex-col gap-3">
                {properties.map((property) => {
                    const requestLabel =
                        property.brokerRequestCount === 1
                            ? "1 broker requested"
                            : `${property.brokerRequestCount} brokers requested`;

                    return (
                        <li
                            key={property.id}
                            className="
                              flex items-center gap-3 rounded-card bg-surface p-3
                              md:gap-4 md:p-4
                            "
                        >
                            <span
                                className="
                                  flex shrink-0 items-center justify-center rounded-card
                                  bg-surface-muted text-ink-muted block-12 inline-12
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
                                <p className="body-sm mbs-0.5 text-ink-muted">
                                    {property.listedLabel} · {requestLabel}
                                </p>
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                nativeButton={false}
                                render={<Link href={`/broker/properties/${property.id}`} />}
                                className="shrink-0 border-2 border-border-warm"
                            >
                                Request
                            </Button>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
