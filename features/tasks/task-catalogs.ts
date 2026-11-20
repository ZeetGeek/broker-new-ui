"use client";

import { useQuery } from "@tanstack/react-query";

import { isMockMode } from "@/lib/api/mock-mode";
import { type TaskLinkOptionsDto, tasksApi } from "@/lib/api/tasks";

import { TASK_CLIENTS, TASK_OWNERS, TASK_PROPERTIES } from "./preview-store";

export type TaskCatalogs = {
    clients: TaskLinkOptionsDto["clients"];
    owners: TaskLinkOptionsDto["owners"];
    properties: TaskLinkOptionsDto["properties"];
    ready: boolean;
};

const EMPTY_CATALOGS: TaskCatalogs = { clients: [], owners: [], properties: [], ready: false };

const MOCK_CATALOGS: TaskCatalogs = {
    clients: TASK_CLIENTS.map((client) => ({ ...client })),
    owners: TASK_OWNERS.map((owner) => ({ ...owner, type: "platform" as const })),
    properties: TASK_PROPERTIES.map((property) => ({
        id: property.id,
        title: property.title,
        locality: property.locality,
        city: property.city,
        address: property.address,
        configLabel: property.configLabel,
        imageUrl: property.imageUrl,
    })),
    ready: true,
};

export const TASK_CATALOGS_QUERY_KEY = ["task-link-options"] as const;

export function useTaskCatalogs(): TaskCatalogs {
    const mock = isMockMode();
    const query = useQuery({
        queryKey: TASK_CATALOGS_QUERY_KEY,
        queryFn: tasksApi.linkOptions,
        enabled: !mock,
        staleTime: 60_000,
    });
    if (mock) return MOCK_CATALOGS;
    return query.data ? { ...query.data, ready: true } : EMPTY_CATALOGS;
}
