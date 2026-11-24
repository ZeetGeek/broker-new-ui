"use client";

import { useState } from "react";

import { formatPersonName } from "@/lib/format/person-name";

import toast from "@/components/shared/app-toast";
import { PeopleInlineSelect } from "@/components/shared/people-inline-select";
import {
    PeoplePicker,
    PeoplePickerField,
    type PeoplePickerPerson,
} from "@/components/shared/people-picker";
import { Button } from "@/components/ui/button";

import { DesignSystemShell } from "@/features/design-system/design-system-shell";
import {
    PEOPLE_PICKER_API,
    PEOPLE_PICKER_USES,
} from "@/features/design-system/theme/people-picker-tokens";

const DEMO_PEOPLE: PeoplePickerPerson[] = [
    {
        id: "c1",
        name: "Aarav Shah",
        role: "client",
        phoneDigits: "9876543210",
        lookingFor: "buy",
    },
    {
        id: "c2",
        name: "Divyesh B",
        role: "client",
        phoneDigits: "9123456780",
        lookingFor: "rent",
    },
    {
        id: "c3",
        name: "Rohan Verma",
        role: "client",
        phoneDigits: "9988776655",
        lookingFor: "both",
    },
    {
        id: "c4",
        name: "Shivendra",
        role: "client",
        phoneDigits: "9012345678",
        lookingFor: "buy",
    },
    {
        id: "c5",
        name: "buyer test",
        role: "client",
        phoneDigits: "9898989898",
        lookingFor: "both",
    },
    {
        id: "c6",
        name: "jeet",
        role: "client",
        phoneDigits: "9765432109",
        lookingFor: "buy",
    },
    {
        id: "o1",
        name: "Ramesh Patel",
        role: "owner",
        phoneDigits: "9811122233",
        ownerType: "individual",
    },
    {
        id: "o2",
        name: "exclusive owner",
        role: "owner",
        phoneDigits: "9822233344",
        ownerType: "builder",
    },
    {
        id: "o3",
        name: "exclOwner",
        role: "owner",
        phoneDigits: "9833344455",
        ownerType: "company",
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

function ClientSingleDemo() {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState<string | null>("c1");
    const selected = DEMO_PEOPLE.find((person) => person.id === value);

    return (
        <div className="flex flex-col items-start gap-3">
            <p className="body-sm text-ink-muted">
                Selected:{" "}
                <span className="font-semibold text-ink">
                    {selected ? formatPersonName(selected.name) : "None"}
                </span>
            </p>
            <Button type="button" variant="outline" onClick={() => setOpen(true)}>
                Open client picker
            </Button>
            <PeoplePicker
                open={open}
                onOpenChange={setOpen}
                kinds="client"
                people={DEMO_PEOPLE}
                value={value}
                onConfirm={setValue}
                onCreate={() => toast.info("Wire Create client from the feature screen.")}
                allowClear
            />
        </div>
    );
}

function OwnerSingleDemo() {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState<string | null>(null);

    return (
        <div className="flex flex-col items-start gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(true)}>
                Open owner picker
            </Button>
            <PeoplePicker
                open={open}
                onOpenChange={setOpen}
                kinds="owner"
                people={DEMO_PEOPLE}
                value={value}
                onConfirm={setValue}
                title="Attach exclusive owner"
                description="Choose one owner for this listing. You can change them later."
                onCreate={() => toast.info("Wire Create owner from the feature screen.")}
            />
        </div>
    );
}

function BothDemo() {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState<string | null>(null);
    const selected = DEMO_PEOPLE.find((person) => person.id === value);

    return (
        <div className="flex flex-col items-start gap-3">
            <p className="body-sm text-ink-muted">
                Selected:{" "}
                <span className="font-semibold text-ink">
                    {selected
                        ? `${formatPersonName(selected.name)} · ${selected.role === "owner" ? "Owner" : "Client"}`
                        : "None"}
                </span>
            </p>
            <Button type="button" variant="outline" onClick={() => setOpen(true)}>
                Open people picker
            </Button>
            <PeoplePicker
                open={open}
                onOpenChange={setOpen}
                kinds="both"
                people={DEMO_PEOPLE}
                value={value}
                onConfirm={setValue}
                title="Select a client or owner"
                onCreate={() => toast.info("Wire create contact from the feature screen.")}
            />
        </div>
    );
}

function MultiDemo() {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState<string[]>(["c1", "c3"]);

    return (
        <div className="flex flex-col items-start gap-3">
            <p className="body-sm text-ink-muted">
                Selected:{" "}
                <span className="font-semibold text-ink">
                    {value.length === 0
                        ? "None"
                        : value
                              .map((id) =>
                                  formatPersonName(
                                      DEMO_PEOPLE.find((person) => person.id === id)?.name ?? id,
                                  ),
                              )
                              .join(", ")}
                </span>
            </p>
            <Button type="button" variant="outline" onClick={() => setOpen(true)}>
                Open multi client picker
            </Button>
            <PeoplePicker
                open={open}
                onOpenChange={setOpen}
                kinds="client"
                multiple
                people={DEMO_PEOPLE}
                value={value}
                onConfirm={setValue}
                title="Attach clients"
                description="Pick everyone who should see this listing."
                onCreate={() => toast.info("Wire Create client from the feature screen.")}
                allowClear
                clearLabel="Clear all"
            />
        </div>
    );
}

function FieldDemos() {
    const [clientId, setClientId] = useState<string | null>(null);
    const [ownerId, setOwnerId] = useState<string | null>("o1");
    const [eitherId, setEitherId] = useState<string | null>(null);
    const [multiIds, setMultiIds] = useState<string[]>([]);

    return (
        <div className="grid gap-5 inline-full max-inline-lg sm:grid-cols-2">
            <PeoplePickerField
                kinds="client"
                label="Client"
                required
                people={DEMO_PEOPLE}
                value={clientId}
                onConfirm={setClientId}
                onCreate={() => toast.info("Create client")}
            />
            <PeoplePickerField
                kinds="owner"
                label="Owner"
                people={DEMO_PEOPLE}
                value={ownerId}
                onConfirm={setOwnerId}
                allowClear
                clearLabel="Any owner"
            />
            <PeoplePickerField
                kinds="both"
                label="Client or owner"
                people={DEMO_PEOPLE}
                value={eitherId}
                onConfirm={setEitherId}
            />
            <PeoplePickerField
                kinds="client"
                multiple
                label="Clients"
                people={DEMO_PEOPLE}
                value={multiIds}
                onConfirm={setMultiIds}
                placeholder="Select clients"
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
            <PeoplePicker
                open={open}
                onOpenChange={setOpen}
                kinds="client"
                people={[]}
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
            <PeoplePicker
                open={open}
                onOpenChange={setOpen}
                kinds="client"
                people={[]}
                value={null}
                onConfirm={() => undefined}
                onCreate={() => toast.info("Create client")}
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
            <PeoplePicker
                open={open}
                onOpenChange={setOpen}
                kinds="owner"
                people={[]}
                value={null}
                onConfirm={() => undefined}
                errorText="Couldn't load owners. Check your connection and try again."
                onRetry={() => toast.info("Refetch owners")}
            />
        </>
    );
}

function InlineSelectDemos() {
    const [bothId, setBothId] = useState<string | null>(null);
    const [clientId, setClientId] = useState<string | null>(null);
    const [ownerId, setOwnerId] = useState<string | null>(null);

    return (
        <div className="grid gap-5 inline-full max-inline-lg sm:grid-cols-2">
            <PeopleInlineSelect
                label="Client or owner"
                people={DEMO_PEOPLE}
                value={bothId}
                onValueChange={setBothId}
                placeholder="Select a client or owner"
                onCreate={(query) => toast.info(`Create contact: ${query}`)}
            />
            <PeopleInlineSelect
                label="Client"
                people={DEMO_PEOPLE}
                value={clientId}
                onValueChange={setClientId}
                lockedScope="client"
                placeholder="Select a client"
                allowClear
                clearLabel="Any client"
                onCreate={(query) => toast.info(`Create client: ${query}`)}
                createLabel="Create client"
            />
            <PeopleInlineSelect
                label="Owner"
                people={DEMO_PEOPLE}
                value={ownerId}
                onValueChange={setOwnerId}
                lockedScope="owner"
                placeholder="Any owner"
                allowClear
                clearLabel="Any owner"
                onCreate={(query) => toast.info(`Create owner: ${query}`)}
                createLabel="Create owner"
            />
        </div>
    );
}

export function PeoplePickerThemePage() {
    return (
        <DesignSystemShell
            eyebrow="Components"
            title="People picker"
            description="Modal for full pick flows, plus a compact inline select for mentions and filters — All / Clients / Owners, with Create when search finds nobody."
        >
            <section className="mbe-10 flex flex-col gap-4">
                <h2 className="h3 text-ink">When to use</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                    {PEOPLE_PICKER_USES.map((item) => (
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
                    <Swatch label="Client · single">
                        <ClientSingleDemo />
                    </Swatch>
                    <Swatch label="Owner · single">
                        <OwnerSingleDemo />
                    </Swatch>
                    <Swatch label="Both · role tabs">
                        <BothDemo />
                    </Swatch>
                    <Swatch label="Client · multi">
                        <MultiDemo />
                    </Swatch>
                </div>
            </section>

            <section className="mbe-10 flex flex-col gap-4">
                <h2 className="h3 text-ink">Field trigger</h2>
                <p className="body-sm text-ink-muted max-inline-[65ch]">
                    Use <code className="font-mono text-ink">PeoplePickerField</code> on forms and
                    filter sheets. Same modal — consistent face with avatar when someone is chosen.
                </p>
                <div className="rounded-card border border-border-warm bg-surface p-5">
                    <FieldDemos />
                </div>
            </section>

            <section className="mbe-10 flex flex-col gap-4">
                <h2 className="h3 text-ink">Inline select</h2>
                <p className="body-sm text-ink-muted max-inline-[65ch]">
                    Use <code className="font-mono text-ink">PeopleInlineSelect</code> for @
                    mentions, filter sheets, and compact fields. Type a name that is not in the list
                    to see Create it.
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
                    {PEOPLE_PICKER_API.map((item) => (
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
