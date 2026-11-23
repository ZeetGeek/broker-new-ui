"use client";

import { useState } from "react";

import { PropertyInlineSelect } from "@/components/shared/property-inline-select";
import {
    PropertyPicker,
    PropertyPickerField,
    type PropertyPickerProperty,
} from "@/components/shared/property-picker";
import { propertyInfoLine } from "@/components/shared/property-picker-meta";
import { Button } from "@/components/ui/button";

import { DesignSystemShell } from "@/features/design-system/design-system-shell";
import {
    PROPERTY_PICKER_API,
    PROPERTY_PICKER_USES,
} from "@/features/design-system/theme/property-picker-tokens";

const DEMO_PROPERTIES: PropertyPickerProperty[] = [
    {
        id: "p1",
        title: "Agricultural land in Mogri",
        propertyTypeLabel: "Agricultural",
        areaSqft: 1_74_240,
        locality: "Mogri",
        city: "Anand",
        state: "Gujarat",
        saleAmountInr: 2_50_00_000,
        rentAmountInr: 15_000,
        commissionPercent: 2,
        commissionAmountInr: 15_000,
    },
    {
        id: "p2",
        title: "2 BHK near CG Road",
        propertyTypeLabel: "Apartment",
        areaSqft: 1_150,
        bhk: 2,
        bathrooms: 2,
        locality: "Navrangpura",
        city: "Ahmedabad",
        state: "Gujarat",
        rentAmountInr: 28_000,
        commissionAmountInr: 14_000,
    },
    {
        id: "p3",
        title: "Villa in Bopal",
        propertyTypeLabel: "Villa",
        areaSqft: 3_200,
        bhk: 4,
        bathrooms: 4,
        locality: "Bopal",
        city: "Ahmedabad",
        state: "Gujarat",
        saleAmountInr: 3_50_00_000,
        commissionPercent: 1.5,
    },
    {
        id: "p4",
        title: "Studio in Prahlad Nagar",
        propertyTypeLabel: "Apartment",
        areaSqft: 480,
        bhk: 1,
        bathrooms: 1,
        locality: "Prahlad Nagar",
        city: "Ahmedabad",
        state: "Gujarat",
        rentAmountInr: 18_000,
        commissionAmountInr: 9_000,
    },
    {
        id: "p5",
        title: "Plot near SP Ring Road",
        propertyTypeLabel: "Plot",
        areaSqft: 2_400,
        locality: "Science City",
        city: "Ahmedabad",
        state: "Gujarat",
        saleAmountInr: 85_00_000,
        commissionPercent: 2,
    },
    {
        id: "p6",
        title: "Office in SG Highway",
        propertyTypeLabel: "Office",
        areaSqft: 1_100,
        locality: "SG Highway",
        city: "Ahmedabad",
        state: "Gujarat",
        rentAmountInr: 65_000,
        commissionAmountInr: 32_500,
    },
];

function Swatch({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col items-start gap-3 rounded-card bg-surface-muted p-5">
            <p className="eyebrow">{label}</p>
            {children}
        </div>
    );
}

function SingleDemo() {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState<string | null>("p1");
    const selected = DEMO_PROPERTIES.find((property) => property.id === value);

    return (
        <div className="flex flex-col items-start gap-3">
            <p className="body-sm text-ink-muted">
                Selected:{" "}
                <span className="font-semibold text-ink">
                    {selected ? propertyInfoLine(selected) : "None"}
                </span>
            </p>
            <Button type="button" variant="outline" onClick={() => setOpen(true)}>
                Open property picker
            </Button>
            <PropertyPicker
                open={open}
                onOpenChange={setOpen}
                properties={DEMO_PROPERTIES}
                value={value}
                onConfirm={setValue}
                onCreate={() => window.alert("Wire Add property from the feature screen.")}
                allowClear
            />
        </div>
    );
}

function SaleOnlyDemo() {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState<string | null>(null);

    return (
        <div className="flex flex-col items-start gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(true)}>
                Open sale picker
            </Button>
            <PropertyPicker
                open={open}
                onOpenChange={setOpen}
                lookingFor="sale"
                properties={DEMO_PROPERTIES}
                value={value}
                onConfirm={setValue}
                title="Select a sale listing"
                description="Only sale listings in this pool."
                onCreate={() => window.alert("Wire Add property from the feature screen.")}
            />
        </div>
    );
}

function MultiDemo() {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState<string[]>(["p1", "p3"]);

    return (
        <div className="flex flex-col items-start gap-3">
            <p className="body-sm text-ink-muted">
                Selected:{" "}
                <span className="font-semibold text-ink">
                    {value.length === 0
                        ? "None"
                        : value
                              .map((id) => {
                                  const property = DEMO_PROPERTIES.find((item) => item.id === id);
                                  return property ? propertyInfoLine(property) : id;
                              })
                              .join(", ")}
                </span>
            </p>
            <Button type="button" variant="outline" onClick={() => setOpen(true)}>
                Open multi property picker
            </Button>
            <PropertyPicker
                open={open}
                onOpenChange={setOpen}
                multiple
                properties={DEMO_PROPERTIES}
                value={value}
                onConfirm={setValue}
                title="Attach properties"
                description="Pick every listing that should be linked."
                onCreate={() => window.alert("Wire Add property from the feature screen.")}
                allowClear
                clearLabel="Clear all"
            />
        </div>
    );
}

function FieldDemos() {
    const [singleId, setSingleId] = useState<string | null>(null);
    const [saleId, setSaleId] = useState<string | null>("p1");
    const [multiIds, setMultiIds] = useState<string[]>([]);

    return (
        <div className="grid gap-5 inline-full max-inline-lg sm:grid-cols-2">
            <PropertyPickerField
                label="Property"
                required
                properties={DEMO_PROPERTIES}
                value={singleId}
                onConfirm={setSingleId}
                onCreate={() => window.alert("Add property")}
            />
            <PropertyPickerField
                label="Sale listing"
                lookingFor="sale"
                properties={DEMO_PROPERTIES}
                value={saleId}
                onConfirm={setSaleId}
                allowClear
                clearLabel="Any sale listing"
            />
            <PropertyPickerField
                multiple
                label="Properties"
                properties={DEMO_PROPERTIES}
                value={multiIds}
                onConfirm={setMultiIds}
                placeholder="Select properties"
            />
        </div>
    );
}

function LoadingDemo() {
    const [open, setOpen] = useState(false);
    return (
        <>
            <Button type="button" variant="outline" onClick={() => setOpen(true)}>
                Open loading state
            </Button>
            <PropertyPicker
                open={open}
                onOpenChange={setOpen}
                properties={[]}
                value={null}
                onConfirm={() => undefined}
                loading
            />
        </>
    );
}

function EmptyDemo() {
    const [open, setOpen] = useState(false);
    return (
        <>
            <Button type="button" variant="outline" onClick={() => setOpen(true)}>
                Open empty state
            </Button>
            <PropertyPicker
                open={open}
                onOpenChange={setOpen}
                properties={[]}
                value={null}
                onConfirm={() => undefined}
                onCreate={() => window.alert("Add property")}
            />
        </>
    );
}

function ErrorDemo() {
    const [open, setOpen] = useState(false);
    return (
        <>
            <Button type="button" variant="outline" onClick={() => setOpen(true)}>
                Open error state
            </Button>
            <PropertyPicker
                open={open}
                onOpenChange={setOpen}
                properties={[]}
                value={null}
                onConfirm={() => undefined}
                errorText="Couldn't load properties. Check your connection and try again."
                onRetry={() => window.alert("Refetch properties")}
            />
        </>
    );
}

function InlineSelectDemos() {
    const [bothId, setBothId] = useState<string | null>(null);
    const [saleId, setSaleId] = useState<string | null>(null);
    const [rentId, setRentId] = useState<string | null>(null);

    return (
        <div className="grid gap-5 inline-full max-inline-lg sm:grid-cols-2">
            <PropertyInlineSelect
                label="Property"
                properties={DEMO_PROPERTIES}
                value={bothId}
                onValueChange={setBothId}
                placeholder="Select a property"
                onCreate={(query) => window.alert(`Add property: ${query}`)}
            />
            <PropertyInlineSelect
                label="Sale listing"
                properties={DEMO_PROPERTIES}
                value={saleId}
                onValueChange={setSaleId}
                lockedScope="sale"
                placeholder="Select a sale listing"
                allowClear
                clearLabel="Any sale listing"
                onCreate={(query) => window.alert(`Add sale listing: ${query}`)}
                createLabel="Add property"
            />
            <PropertyInlineSelect
                label="Rent listing"
                properties={DEMO_PROPERTIES}
                value={rentId}
                onValueChange={setRentId}
                lockedScope="rent"
                placeholder="Any rent listing"
                allowClear
                clearLabel="Any rent listing"
            />
        </div>
    );
}

export function PropertyPickerThemePage() {
    return (
        <DesignSystemShell
            eyebrow="Components"
            title="Property picker"
            description="Modal for full pick flows, plus a compact inline select for filters — All / Sale / Rent, with Add property when search finds nobody."
        >
            <section className="mbe-10 flex flex-col gap-4">
                <h2 className="h3 text-ink">When to use</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                    {PROPERTY_PICKER_USES.map((item) => (
                        <div
                            key={item.title}
                            className="rounded-card border border-border-warm bg-surface p-4"
                        >
                            <p className="body font-semibold text-ink">{item.title}</p>
                            <p className="body-sm mbs-1 text-ink-muted">{item.body}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="mbe-10 flex flex-col gap-4">
                <h2 className="h3 text-ink">Modal variants</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Swatch label="Both · Sale / Rent tabs">
                        <SingleDemo />
                    </Swatch>
                    <Swatch label="Sale only">
                        <SaleOnlyDemo />
                    </Swatch>
                    <Swatch label="Multi">
                        <MultiDemo />
                    </Swatch>
                </div>
            </section>

            <section className="mbe-10 flex flex-col gap-4">
                <h2 className="h3 text-ink">Field trigger</h2>
                <p className="body-sm text-ink-muted max-inline-[65ch]">
                    Use <code className="font-mono text-ink">PropertyPickerField</code> on forms and
                    filter sheets. Same modal — consistent face with cover when a listing is chosen.
                </p>
                <div className="rounded-card border border-border-warm bg-surface p-5">
                    <FieldDemos />
                </div>
            </section>

            <section className="mbe-10 flex flex-col gap-4">
                <h2 className="h3 text-ink">Inline select</h2>
                <p className="body-sm text-ink-muted max-inline-[65ch]">
                    Use <code className="font-mono text-ink">PropertyInlineSelect</code> for filter
                    sheets and compact fields. Type a title that is not in the list to see Add
                    property.
                </p>
                <div className="rounded-card border border-border-warm bg-surface p-5">
                    <InlineSelectDemos />
                </div>
            </section>

            <section className="mbe-10 flex flex-col gap-4">
                <h2 className="h3 text-ink">States</h2>
                <div className="grid gap-4 sm:grid-cols-3">
                    <Swatch label="Loading">
                        <LoadingDemo />
                    </Swatch>
                    <Swatch label="Empty">
                        <EmptyDemo />
                    </Swatch>
                    <Swatch label="Error">
                        <ErrorDemo />
                    </Swatch>
                </div>
            </section>

            <section className="flex flex-col gap-4">
                <h2 className="h3 text-ink">API notes</h2>
                <ul className="flex flex-col gap-3">
                    {PROPERTY_PICKER_API.map((item) => (
                        <li
                            key={item.name}
                            className="rounded-inner border border-border-warm bg-surface px-4 py-3"
                        >
                            <p className="body-sm font-semibold text-ink">
                                <code className="font-mono">{item.name}</code>
                            </p>
                            <p className="body-sm mbs-0.5 text-ink-muted">{item.detail}</p>
                        </li>
                    ))}
                </ul>
            </section>
        </DesignSystemShell>
    );
}
