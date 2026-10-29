"use client";

import Link from "next/link";

import { ProgressiveBlur } from "@/components/motion-primitives/progressive-blur";
import {
    Building2,
    Calendar,
    Contact,
    FacebookIcon,
    InstagramIcon,
    LinkedInIcon,
    UserPlus,
} from "@/components/shared/icons";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";

import { APP_NAME } from "@/config";

import { HeroBg } from "./hero-bg";
import { RotatingBrokerHeadline } from "./rotating-broker-headline";

const BROKER_SIGNUP_HREF = "/register?portal=broker";

// Replace these placeholders with the product's official profile URLs at launch.
const SOCIAL_LINKS = [
    { label: "Instagram", icon: InstagramIcon, href: "#" },
    { label: "Facebook", icon: FacebookIcon, href: "#" },
    { label: "LinkedIn", icon: LinkedInIcon, href: "#" },
];

const HERO_COPY = {
    lede: "Add property listings, keep client details handy and schedule site visits. Track your deals in one place, right from your phone.",
    primary: { label: "Create broker account", href: BROKER_SIGNUP_HREF },
    features: [
        { icon: Building2, label: "Property listings" },
        { icon: Contact, label: "Client records" },
        { icon: Calendar, label: "Site visits" },
    ],
    note: "Built for real estate brokers.",
};

export function HomeHero() {
    return (
        <section className="relative overflow-hidden min-block-svh">
            <div className="absolute inset-0 bg-brand-ink" aria-hidden="true">
                <HeroBg />

                <ProgressiveBlur
                    className="
                      pointer-events-none absolute inset-x-0 inset-bs-0 block-1/5
                      md:block-1/4
                    "
                    direction="top"
                    blurLayers={4}
                    blurIntensity={2}
                />
                <ProgressiveBlur
                    className="
                      pointer-events-none absolute inset-x-0 inset-be-0 block-1/5
                      md:block-1/4
                    "
                    direction="bottom"
                    blurLayers={4}
                    blurIntensity={2}
                />

                <div
                    className="
                      absolute inset-0 bg-linear-to-b from-brand-ink/40 via-brand-ink/58
                      to-brand-ink/75
                    "
                />
            </div>

            <header
                className="
                  absolute inset-x-0 inset-bs-0 z-10 flex items-center justify-between p-4
                  md:p-6
                "
            >
                <Logo variant="accent" />
                <nav aria-label="Account" className="flex items-center gap-2">
                    <Button
                        variant="link"
                        className="text-canvas hover:text-canvas"
                        render={<Link href="/login" />}
                    >
                        Log in
                    </Button>
                    <Button variant="highlight" render={<Link href={BROKER_SIGNUP_HREF} />}>
                        Get started
                    </Button>
                </nav>
            </header>

            <div
                className="
                  relative z-10 mx-auto flex items-center justify-center px-5 py-28
                  max-inline-[800px] min-block-svh
                "
            >
                <div className="relative flex flex-col items-center gap-6 text-center inline-full md:p-8">
                    <div
                        aria-hidden="true"
                        className="
                          pointer-events-none absolute -inset-x-4 -inset-y-6 rounded-card bg-radial
                          from-brand-ink/45 from-20% via-brand-ink/25 via-50% to-transparent to-75%
                          md:-inset-x-10 md:-inset-y-8
                        "
                    />

                    <RotatingBrokerHeadline />

                    <p
                        className="
                          body relative -mt-2 text-canvas/90
                          [text-shadow:0_1px_16px_var(--color-brand-ink)] max-inline-[460px]
                        "
                    >
                        {HERO_COPY.lede}
                    </p>

                    <div
                        className="
                          relative flex flex-col gap-2.5 inline-full
                          sm:flex-row sm:inline-auto
                        "
                    >
                        <Button
                            size="lg"
                            variant="highlight"
                            nativeButton={false}
                            render={<Link href={HERO_COPY.primary.href} />}
                        >
                            <UserPlus aria-hidden="true" data-icon="inline-end" />
                            {HERO_COPY.primary.label}
                        </Button>
                    </div>

                    <ul
                        className="
                          body-sm relative flex flex-wrap items-center justify-center gap-x-5
                          gap-y-3 text-canvas
                        "
                    >
                        {HERO_COPY.features.map(({ icon: Icon, label }) => (
                            <li key={label} className="flex items-center gap-2">
                                <Icon aria-hidden="true" className="shrink-0 block-4 inline-4" />
                                {label}
                            </li>
                        ))}
                    </ul>

                    <div
                        aria-hidden="true"
                        className="relative bg-linear-to-r from-transparent via-canvas/40 to-transparent block-px inline-full max-inline-xs"
                    />

                    <p className="body-sm relative text-canvas/90">{HERO_COPY.note}</p>
                </div>
            </div>
            <footer className="absolute inset-x-0 inset-be-0 z-10 flex flex-col items-center justify-between gap-2 px-4 py-3 text-canvas/90 sm:flex-row md:px-6 md:py-4">
                <p className="body-sm">
                    © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
                </p>
                <nav aria-label="Social media" className="flex items-center">
                    {SOCIAL_LINKS.map(({ label, icon: Icon, href }) => (
                        <a
                            key={label}
                            href={href}
                            onClick={(event) => event.preventDefault()}
                            aria-label={`${label} (coming soon)`}
                            title={`${label} — coming soon`}
                            className="flex items-center justify-center rounded-control text-canvas/90 block-11 inline-11 hover:text-highlight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-highlight sm:inline-9"
                        >
                            <Icon aria-hidden="true" className="block-5 inline-5" />
                        </a>
                    ))}
                </nav>
            </footer>
        </section>
    );
}
