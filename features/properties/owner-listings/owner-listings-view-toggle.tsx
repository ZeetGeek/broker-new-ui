"use client";

import { LayoutGrid, List } from "lucide-react";

import {
    IconSegmentedToggle,
    type IconSegmentedOption,
} from "@/components/shared/icon-segmented-toggle";

import type { OwnerListingsView } from "@/features/properties/owner-listings/use-owner-listings-view";

export type OwnerListingsViewToggleProps = {
    view: OwnerListingsView;
    onViewChange: (view: OwnerListingsView) => void;
    className?: string;
};

const VIEW_OPTIONS: readonly IconSegmentedOption<OwnerListingsView>[] = [
    { value: "grid", label: "Grid view", icon: LayoutGrid },
    { value: "list", label: "List view", icon: List },
];

export function OwnerListingsViewToggle({
    view,
    onViewChange,
    className,
}: OwnerListingsViewToggleProps) {
    return (
        <IconSegmentedToggle
            value={view}
            onValueChange={onViewChange}
            options={VIEW_OPTIONS}
            ariaLabel="Results layout"
            className={className}
        />
    );
}
