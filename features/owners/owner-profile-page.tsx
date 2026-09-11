"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { BadgeCheck, Building2, ChevronLeft, MapPin, UserRound } from "lucide-react";

import { ApiError } from "@/lib/api/client";
import { type BrokerOwnerProfile, ownersApi } from "@/lib/api/owners";
import { formatPlaceName } from "@/lib/format/owner-listings-labels";
import { BROKER_OWNER_LISTINGS_HREF } from "@/lib/routes/broker";

import { EmptyState } from "@/components/shared/empty-state";
import { PhoneNumber } from "@/components/shared/phone-number";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";

import { OwnerProfileSkeleton } from "@/features/owners/owner-profile-skeleton";

function listingCountLabel(count: number): string {
    return count === 1 ? "1 property listed" : `${count} properties listed`;
}

function NotFoundState() {
    return (
        <EmptyState
            icon={UserRound}
            heading="Owner not found"
            description="This owner profile may be private, or it is no longer available."
        >
            <Button
                nativeButton={false}
                className="bg-brand-ink text-surface hover:bg-brand-ink/90"
                render={<Link href={BROKER_OWNER_LISTINGS_HREF} />}
            >
                Back to owner listings
            </Button>
        </EmptyState>
    );
}

function OwnerProfileView({ profile }: { profile: BrokerOwnerProfile }) {
    const name = formatPlaceName(profile.name);
    const location = profile.locationLabel ? formatPlaceName(profile.locationLabel) : undefined;
    const areas = profile.localities.map(formatPlaceName).filter(Boolean);

    return (
        <div className="flex flex-col gap-6 pbe-24 lg:pbe-8">
            <Link
                href={BROKER_OWNER_LISTINGS_HREF}
                className="
                  body-sm inline-flex items-center gap-1 font-medium tracking-wide text-ink-muted
                  transition-colors duration-160 inline-fit
                  hover:text-ink
                "
            >
                <ChevronLeft aria-hidden className="block-4 inline-4" strokeWidth={2} />
                Owner listings
            </Link>

            <section className="flex flex-col gap-4 rounded-card border border-border-warm bg-surface p-5">
                <div className="flex items-center gap-4 min-inline-0">
                    <UserAvatar name={name} imageUrl={profile.avatarUrl} size="lg" />
                    <div className="flex flex-col gap-1 min-inline-0">
                        <div className="flex items-center gap-2 min-inline-0">
                            <h1 className="h3 truncate tracking-wide text-ink capitalize">{name}</h1>
                            {profile.verified ? (
                                <BadgeCheck
                                    aria-label="Verified owner"
                                    className="shrink-0 text-brand block-5 inline-5"
                                    strokeWidth={1.75}
                                />
                            ) : null}
                        </div>
                        {location ? (
                            <p className="body-sm flex items-center gap-1.5 tracking-wide text-ink-muted">
                                <MapPin
                                    aria-hidden
                                    className="shrink-0 block-3.5 inline-3.5"
                                    strokeWidth={1.75}
                                />
                                <span className="truncate capitalize">{location}</span>
                            </p>
                        ) : null}
                        {profile.listingCount != null ? (
                            <p className="body-sm tracking-wide text-ink-muted">
                                {listingCountLabel(profile.listingCount)}
                            </p>
                        ) : null}
                    </div>
                </div>

                {profile.companyName ? (
                    <p className="body-sm flex items-center gap-1.5 tracking-wide text-ink">
                        <Building2
                            aria-hidden
                            className="shrink-0 block-3.5 inline-3.5 text-ink-muted"
                            strokeWidth={1.75}
                        />
                        <span className="truncate capitalize">
                            {formatPlaceName(profile.companyName)}
                        </span>
                    </p>
                ) : null}

                {profile.phoneDigits ? (
                    <PhoneNumber phoneDigits={profile.phoneDigits} className="body-sm text-ink" />
                ) : null}
            </section>

            {profile.bio ? (
                <section className="flex flex-col gap-2 rounded-card border border-border-warm bg-surface p-5">
                    <h2 className="eyebrow">About</h2>
                    <p className="body tracking-wide text-ink">{profile.bio}</p>
                </section>
            ) : null}

            {areas.length > 0 ? (
                <section className="flex flex-col gap-2 rounded-card border border-border-warm bg-surface p-5">
                    <h2 className="eyebrow">Areas</h2>
                    <p className="body-sm tracking-wide text-ink capitalize">{areas.join(", ")}</p>
                </section>
            ) : null}
        </div>
    );
}

export function OwnerProfilePage() {
    const params = useParams<{ id: string }>();
    const ownerUserId = params.id;
    const [profile, setProfile] = useState<BrokerOwnerProfile | null | undefined>(undefined);

    useEffect(() => {
        let cancelled = false;

        void ownersApi
            .get(ownerUserId)
            .then((next) => {
                if (!cancelled) setProfile(next);
            })
            .catch(() => {
                if (!cancelled) setProfile(null);
            });

        return () => {
            cancelled = true;
        };
    }, [ownerUserId]);

    if (profile === undefined) return <OwnerProfileSkeleton />;
    if (!profile) return <NotFoundState />;

    return <OwnerProfileView profile={profile} />;
}
