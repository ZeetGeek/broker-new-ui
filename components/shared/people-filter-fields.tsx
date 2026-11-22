"use client";

import { useId } from "react";

import { useQuery } from "@tanstack/react-query";

import { myListingsApi } from "@/lib/api/my-listings";
import { pipelineApi } from "@/lib/api/pipeline";
import type { PeopleFilters, PeopleFilterScope } from "@/lib/properties/people-filters";

import { OptionCombobox } from "@/components/shared/option-combobox";
import { Button } from "@/components/ui/button";

import { useAppSelector } from "@/store/hooks";

/** Opt-in controls, mounted only by the two broker CRM filter dialogs. */
export function PeopleFilterFields({
    scope,
    value,
    onChange,
}: {
    scope: PeopleFilterScope;
    value: PeopleFilters;
    onChange: (next: PeopleFilters) => void;
}) {
    const id = useId();
    const userId = useAppSelector((state) => state.auth.user?.id);
    const query = useQuery({
        queryKey: ["people-filter-options", scope, userId],
        queryFn: ({ signal }) =>
            scope === "my-listings"
                ? myListingsApi.peopleOptions(signal)
                : pipelineApi.peopleOptions(signal),
        staleTime: 30_000,
    });
    return (
        <section
            aria-labelledby={`${id}-heading`}
            className="flex flex-col gap-4 border-be border-border-warm py-5"
        >
            <h3 id={`${id}-heading`} className="text-base font-semibold text-ink">
                People
            </h3>
            {query.isError ? (
                <div role="alert" className="flex items-center justify-between gap-3">
                    <p className="body-sm text-danger">Couldn&apos;t load owners and clients.</p>
                    <Button variant="outline" size="sm" onClick={() => void query.refetch()}>
                        Try again
                    </Button>
                </div>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
                {(["owner", "client"] as const).map((kind) => {
                    const key = kind === "owner" ? "ownerId" : "clientId";
                    const label = kind === "owner" ? "Owner" : "Client";
                    const options = kind === "owner" ? query.data?.owners : query.data?.clients;
                    return (
                        <div key={kind} className="flex flex-col gap-2 min-inline-0">
                            <label
                                htmlFor={`${id}-${kind}`}
                                className="body-sm font-medium text-ink"
                            >
                                {label}
                            </label>
                            <OptionCombobox
                                id={`${id}-${kind}`}
                                value={value[key] ?? ""}
                                onValueChange={(next) => onChange({ ...value, [key]: next })}
                                options={[
                                    { value: "", label: `Any ${kind}` },
                                    ...(options ?? []).map((person) => ({
                                        value: person.id,
                                        label: person.name,
                                    })),
                                ]}
                                placeholder={`Any ${kind}`}
                                loading={query.isPending}
                                disabled={query.isError}
                                emptyText={`No matching ${kind}s`}
                            />
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
