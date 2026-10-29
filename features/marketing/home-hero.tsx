"use client";

import Link from "next/link";

import { ProgressiveBlur } from "@/components/motion-primitives/progressive-blur";
import { ArrowRight, Calendar, Contact, MapPin, Rocket } from "@/components/shared/icons";
import { Logo } from "@/components/shared/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { HeroBg } from "./hero-bg";

const BROKER_SIGNUP_HREF = "/register?portal=broker";

const HERO_COPY = {
    title: "Stop losing leads in WhatsApp",
    lede: "Keep your listings, clients and site visits together. A CRM for brokers in Surat, ready to use from your phone.",
    primary: { label: "Create broker account", href: BROKER_SIGNUP_HREF },
    secondary: { label: "Log in", href: "/login" },
    trust: [
        { icon: Contact, label: "Client records" },
        { icon: Calendar, label: "Site visits" },
        { icon: MapPin, label: "Starting in Surat" },
    ],
    note: "Coming soon: property owners list directly, and you apply to represent them.",
};

export function HomeHero() {
    return (
        <section className="relative overflow-hidden block-full">
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
                <nav className="flex items-center gap-2">
                    <Button
                        variant="link"
                        className="text-canvas hover:text-canvas"
                        render={<Link href="/login" />}
                    >
                        Login
                    </Button>
                    <Button variant="highlight" render={<Link href="/register" />}>
                        Get started
                    </Button>
                </nav>
            </header>

            <div
                className="
                  relative z-10 mx-auto flex items-center justify-center px-4 block-full
                  max-inline-[800px]
                "
            >
                <div className="relative flex flex-col items-center gap-6 p-6 text-center md:p-8">
                    <div
                        aria-hidden="true"
                        className="
                          pointer-events-none absolute -inset-x-4 -inset-y-6 rounded-card bg-radial
                          from-brand-ink/45 from-20% via-brand-ink/25 via-50% to-transparent to-75%
                          md:-inset-x-10 md:-inset-y-8
                        "
                    />

                    <Badge color="lime" blur className="relative">
                        <Rocket aria-hidden="true" />
                        Now onboarding brokers
                    </Badge>

                    <h1
                        className="
                          display-2 relative text-canvas
                          [text-shadow:0_2px_24px_var(--color-brand-ink)]
                        "
                    >
                        {HERO_COPY.title}
                    </h1>

                    <p
                        className="
                          body relative text-canvas/90
                          [text-shadow:0_1px_16px_var(--color-brand-ink)] max-inline-[420px]
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
                            {HERO_COPY.primary.label}
                        </Button>
                        <Button
                            size="lg"
                            variant="highlight-outline"
                            className="bg-canvas/10 backdrop-blur-lg hover:bg-canvas/15"
                            nativeButton={false}
                            render={<Link href={HERO_COPY.secondary.href} />}
                        >
                            {HERO_COPY.secondary.label}
                            <ArrowRight aria-hidden="true" data-icon="inline-end" />
                        </Button>
                    </div>

                    <ul
                        className="
                          body-sm relative flex flex-col items-center gap-3 text-canvas/90
                          sm:flex-row sm:gap-0 sm:divide-x sm:divide-canvas/15
                        "
                    >
                        {HERO_COPY.trust.map(({ icon: Icon, label }) => (
                            <li key={label} className="flex items-center gap-2 sm:px-5">
                                <span
                                    className="
                                      flex items-center justify-center rounded-control border
                                      border-canvas/25 bg-canvas/10 backdrop-blur-md block-6
                                      inline-6
                                    "
                                >
                                    <Icon aria-hidden="true" className="block-3.5 inline-3.5" />
                                </span>
                                {label}
                            </li>
                        ))}
                    </ul>

                    <p
                        className="
                          body-sm relative text-canvas/80
                          [text-shadow:0_1px_16px_var(--color-brand-ink)]
                        "
                    >
                        {HERO_COPY.note}
                    </p>
                </div>
            </div>
        </section>
    );
}
