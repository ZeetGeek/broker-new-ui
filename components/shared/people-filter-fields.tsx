"use client";

import { useId, useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import { myListingsApi } from "@/lib/api/my-listings";
import { pipelineApi } from "@/lib/api/pipeline";
import type { PeopleFilters, PeopleFilterScope } from "@/lib/properties/people-filters";

import { mapFilterPersonToPicker } from "@/components/shared/map-to-people-picker-person";
import { PeopleInlineSelect } from "@/components/shared/people-inline-select";
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

    const ownerPeople = useMemo(
        () => (query.data?.owners ?? []).map((person) => mapFilterPersonToPicker(person, "owner")),
        [query.data?.owners],
    );
    const clientPeople = useMemo(
        () =>
            (query.data?.clients ?? []).map((person) => mapFilterPersonToPicker(person, "client")),
        [query.data?.clients],
    );

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
                <div className="flex flex-col gap-2 min-inline-0">
                    <label htmlFor={`${id}-owner`} className="body-sm font-medium text-ink">
                        Owner
                    </label>
                    <PeopleInlineSelect
                        id={`${id}-owner`}
                        lockedScope="owner"
                        people={ownerPeople}
                        value={value.ownerId ?? null}
                        onValueChange={(next) => onChange({ ...value, ownerId: next ?? undefined })}
                        placeholder="Any owner"
                        allowClear
                        clearLabel="Any owner"
                        loading={query.isPending}
                        disabled={query.isError}
                    />
                </div>
                <div className="flex flex-col gap-2 min-inline-0">
                    <label htmlFor={`${id}-client`} className="body-sm font-medium text-ink">
                        Client
                    </label>
                    <PeopleInlineSelect
                        id={`${id}-client`}
                        lockedScope="client"
                        people={clientPeople}
                        value={value.clientId ?? null}
                        onValueChange={(next) =>
                            onChange({ ...value, clientId: next ?? undefined })
                        }
                        placeholder="Any client"
                        allowClear
                        clearLabel="Any client"
                        loading={query.isPending}
                        disabled={query.isError}
                    />
                </div>
            </div>
        </section>
    );
}
