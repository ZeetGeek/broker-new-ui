"use client";

import { Check } from "lucide-react";

import { AvatarStack } from "@/components/shared/avatar-stack";
import { UserAvatar } from "@/components/shared/user-avatar";
import {
    Avatar,
    AvatarBadge,
    AvatarFallback,
    AvatarGroup,
    AvatarGroupCount,
    AvatarImage,
} from "@/components/ui/avatar";

import { DesignSystemShell } from "@/features/design-system/design-system-shell";
import {
    AVATAR_GROUPS,
    AVATAR_SIZES,
    AVATAR_USES,
} from "@/features/design-system/theme/avatar-tokens";

const DEMO_PEOPLE: { id: string; name: string; avatarUrl?: string }[] = [
    { id: "1", name: "Priya Shah", avatarUrl: "https://i.pravatar.cc/80?u=priya-shah" },
    { id: "2", name: "Amit Patel", avatarUrl: "https://i.pravatar.cc/80?u=amit-patel" },
    { id: "3", name: "Neha Desai" },
    { id: "4", name: "Rohan Mehta", avatarUrl: "https://i.pravatar.cc/80?u=rohan-mehta" },
    { id: "5", name: "Kavya Iyer" },
];

function Swatch({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col items-start gap-3 rounded-card bg-surface-muted p-5">
            <p className="eyebrow">{label}</p>
            {children}
        </div>
    );
}

function ImageDemo() {
    return (
        <Avatar size="default">
            <AvatarImage src={DEMO_PEOPLE[0].avatarUrl} alt={DEMO_PEOPLE[0].name} />
            <AvatarFallback>PS</AvatarFallback>
        </Avatar>
    );
}

function FallbackDemo() {
    return (
        <Avatar size="default">
            <AvatarFallback>ND</AvatarFallback>
        </Avatar>
    );
}

function BadgeDemo() {
    return (
        <Avatar size="default">
            <AvatarImage src={DEMO_PEOPLE[1].avatarUrl} alt={DEMO_PEOPLE[1].name} />
            <AvatarFallback>AP</AvatarFallback>
            <AvatarBadge>
                <Check aria-hidden className="size-full" strokeWidth={3} />
            </AvatarBadge>
        </Avatar>
    );
}

function UserAvatarDemo() {
    return (
        <div className="flex items-center gap-3">
            <UserAvatar name="Priya Shah" imageUrl={DEMO_PEOPLE[0].avatarUrl} size="md" />
            <UserAvatar name="Neha Desai" size="md" fallback="shape" />
            <UserAvatar name="Kavya Iyer" size="md" fallback="character" />
            <UserAvatar name="Amit Patel" size="md" fallback="character" />
        </div>
    );
}

function SizeDemo({ size }: { size: "sm" | "default" | "lg" }) {
    return (
        <Avatar size={size}>
            <AvatarImage src={DEMO_PEOPLE[0].avatarUrl} alt={DEMO_PEOPLE[0].name} />
            <AvatarFallback>PS</AvatarFallback>
        </Avatar>
    );
}

function CompoundGroupDemo() {
    return (
        <AvatarGroup>
            {DEMO_PEOPLE.slice(0, 3).map((person) => (
                <Avatar key={person.id} size="default">
                    {person.avatarUrl ? (
                        <AvatarImage src={person.avatarUrl} alt={person.name} />
                    ) : null}
                    <AvatarFallback>
                        {person.name
                            .split(" ")
                            .map((part) => part[0])
                            .join("")
                            .slice(0, 2)}
                    </AvatarFallback>
                </Avatar>
            ))}
            <AvatarGroupCount>+2</AvatarGroupCount>
        </AvatarGroup>
    );
}

function StackDemo() {
    return <AvatarStack people={[...DEMO_PEOPLE]} max={3} />;
}

export function AvatarThemePage() {
    return (
        <DesignSystemShell
            eyebrow="Components"
            title="Avatar."
            description="base-ui Avatar + UserAvatar — circular face for people. Prefer UserAvatar in product UI (avvvatars-react for placeholders). Reach for the compound Avatar when you need a badge or a one-off group. See docs/DESIGN.md §4.17."
        >
            <div className="space-y-10">
                <section>
                    <h2 className="h4 text-ink">Uses</h2>
                    <p className="body-sm mbs-1 text-ink-muted max-inline-[65ch]">
                        Prefer <code className="body-xs">UserAvatar</code> in product screens —
                        photo, shape, or character without assembling the compound parts each
                        time.
                    </p>
                    <div className="mbs-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {AVATAR_USES.map((use) => (
                            <Swatch key={use.name} label={use.label}>
                                <div className="flex min-block-14 items-center justify-center inline-full">
                                    {use.name === "image" ? <ImageDemo /> : null}
                                    {use.name === "fallback" ? <FallbackDemo /> : null}
                                    {use.name === "badge" ? <BadgeDemo /> : null}
                                    {use.name === "user-avatar" ? <UserAvatarDemo /> : null}
                                </div>
                                <p className="body-xs text-ink-subtle">{use.note}</p>
                            </Swatch>
                        ))}
                    </div>
                </section>

                <section>
                    <h2 className="h4 text-ink">Sizes</h2>
                    <p className="body-sm mbs-1 text-ink-muted max-inline-[65ch]">
                        Compound <code className="body-xs">Avatar</code> sizes. Default is{" "}
                        <code className="body-xs">default</code> (32px).{" "}
                        <code className="body-xs">UserAvatar</code> adds{" "}
                        <code className="body-xs">xxs</code> / <code className="body-xs">xs</code>{" "}
                        for dense pipeline rows and{" "}
                        <code className="body-xs">lg</code> at 48px for headers.
                    </p>
                    <div className="mbs-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                        {AVATAR_SIZES.map((size) => (
                            <Swatch key={size.name} label={size.label}>
                                <div className="flex min-block-14 items-center justify-center inline-full">
                                    <SizeDemo size={size.name} />
                                </div>
                                <p className="body-xs text-ink-subtle">{size.note}</p>
                            </Swatch>
                        ))}
                    </div>
                </section>

                <section>
                    <h2 className="h4 text-ink">Groups</h2>
                    <p className="body-sm mbs-1 text-ink-muted max-inline-[65ch]">
                        Overlapping faces for teams and shared deals. Prefer{" "}
                        <code className="body-xs">AvatarStack</code> when names need tooltips or
                        an overflow chip.
                    </p>
                    <div className="mbs-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {AVATAR_GROUPS.map((group) => (
                            <Swatch key={group.name} label={group.label}>
                                <div className="flex min-block-14 items-center justify-center inline-full">
                                    {group.name === "compound" ? <CompoundGroupDemo /> : null}
                                    {group.name === "stack" ? <StackDemo /> : null}
                                </div>
                                <p className="body-xs text-ink-subtle">{group.note}</p>
                            </Swatch>
                        ))}
                    </div>
                </section>

                <section className="rounded-card bg-brand-deep p-5 md:p-6">
                    <p className="eyebrow text-highlight">Rules</p>
                    <ul className="body-sm mbs-3 list-disc space-y-2 ps-5 text-[#B8CFC4]">
                        <li>
                            Product screens use{" "}
                            <code className="body-xs">UserAvatar</code> from{" "}
                            <code className="body-xs">components/shared/user-avatar.tsx</code>.
                            Always pass a real <code className="body-xs">name</code> for alt text
                            and avvvatars seed.
                        </li>
                        <li>
                            Face is always a circle — never a rounded square. Separation from the
                            canvas uses a light ring or the soft border on the primitive, not a
                            drop shadow.
                        </li>
                        <li>
                            Stacked faces go through{" "}
                            <code className="body-xs">AvatarStack</code> (tooltips + overflow) or
                            compound <code className="body-xs">AvatarGroup</code> for short static
                            lists.
                        </li>
                        <li>
                            Fallback order: photo →{" "}
                            <code className="body-xs">avvvatars-react</code>{" "}
                            <code className="body-xs">shape</code> (default) or{" "}
                            <code className="body-xs">character</code>. Prefer character when
                            several different people sit in one row.
                        </li>
                        <li>
                            Only avatar library:{" "}
                            <code className="body-xs">avvvatars-react</code>. Do not add
                            boring-avatars or another generator.
                        </li>
                        <li>
                            Do not edit{" "}
                            <code className="body-xs">components/ui/avatar.tsx</code> for one-off
                            styling — pass <code className="body-xs">className</code>, or wrap in{" "}
                            <code className="body-xs">components/shared/</code>.
                        </li>
                    </ul>
                </section>
            </div>
        </DesignSystemShell>
    );
}
