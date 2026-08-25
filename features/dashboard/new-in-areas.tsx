import Link from "next/link";

import { Building2 } from "lucide-react";

import { cn } from "@/lib/utils";

import { Price } from "@/components/shared/price";
import { Button } from "@/components/ui/button";

import { CardLabel } from "./card-label";
import type { AreaPropertyItem } from "./mock-data";

export type NewInAreasProps = {
    properties: AreaPropertyItem[];
    className?: string;
};

export function NewInAreas({ properties, className }: NewInAreasProps) {
    return (
        <section
            className={cn(
                `
                  flex flex-col rounded-card border border-border-warm bg-surface p-8
                  shadow-sm
                `,
                className,
            )}
        >
            <div className="flex items-center justify-between gap-3">
                <CardLabel info="Fresh listings in the localities you cover — ready to request representation.">
                    New in your areas
                </CardLabel>
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

            {properties.length === 0 ? (
                <p className="body mbs-4 text-ink-muted">No new listings in your areas yet.</p>
            ) : (
                <ul className="mbs-1 flex flex-col">
                    {properties.map((property, index) => {
                        const requestLabel =
                            property.brokerRequestCount === 1
                                ? "1 broker requested"
                                : `${property.brokerRequestCount} brokers requested`;

                        return (
                            <li
                                key={property.id}
                                className={cn(
                                    "flex items-center gap-3 md:gap-4",
                                    index > 0
                                        ? "mbs-3 border-bs border-border-warm pbs-3"
                                        : "mbs-4",
                                )}
                            >
                                <span
                                    className="
                                      flex shrink-0 items-center justify-center rounded-inner
                                      bg-surface-muted text-ink-muted block-12 inline-12
                                    "
                                    aria-hidden
                                >
                                    <Building2
                                        className="block-5 inline-5"
                                        strokeWidth={1.75}
                                    />
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
                                    render={
                                        <Link href={`/broker/properties/${property.id}`} />
                                    }
                                    className="shrink-0 border-2 border-border-warm"
                                >
                                    Request
                                </Button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}
