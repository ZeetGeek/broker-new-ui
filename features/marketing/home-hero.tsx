import {
    ArrowRight02Icon,
    RocketIcon,
    RupeeIcon,
    Shield01Icon,
    SquareLock02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Logo } from "@/components/shared/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { HeroBg } from "./hero-bg";

const TRUST_ITEMS = [
    { icon: Shield01Icon, label: "RERA-verified brokers" },
    { icon: RupeeIcon, label: "No listing fee" },
    { icon: SquareLock02Icon, label: "Your number stays private" },
];

export function HomeHero() {
    return (
        <section className="relative overflow-hidden rounded-card block-full">
            <div className="absolute inset-0 bg-brand-ink" aria-hidden="true">
                <HeroBg />
            </div>

            <header
                className="
                  absolute inset-x-0 inset-bs-0 z-10 flex items-center justify-between p-4
                  md:p-6
                "
            >
                <Logo variant="accent" />
                <nav className="flex items-center gap-2">
                    <Button variant="link">Login</Button>
                    <Button variant="highlight">Get started</Button>
                </nav>
            </header>

            <div
                className="
                  relative z-10 mx-auto flex flex-col items-center justify-center gap-6 px-4
                  text-center block-full max-inline-[800px]
                "
            >
                <Badge
                    variant="brand"
                    className="
                      body-sm border border-brand/30 bg-brand/15 px-3.5 py-1.5 text-canvas
                      [&_svg:not([class*='size-'])]:block-3.5
                      [&_svg:not([class*='size-'])]:inline-3.5
                    "
                >
                    <HugeiconsIcon icon={RocketIcon} />
                    Now onboarding brokers and owners
                </Badge>

                <h1 className="display-2 text-canvas">
                    Sell your property through a broker you trust.
                </h1>

                <p className="body text-canvas/80 max-inline-[420px]">
                    List it free. Verified brokers ask to sell it. You approve the one you like.
                </p>

                <div className="flex flex-col gap-2.5 inline-full sm:flex-row sm:inline-auto">
                    <Button size="lg" variant="highlight">
                        List my property free
                    </Button>
                    <Button size="lg" variant="highlight-outline">
                        I&apos;m a broker
                        <HugeiconsIcon icon={ArrowRight02Icon} data-icon="inline-end" />
                    </Button>
                </div>

                <ul
                    className="
                      body-sm flex flex-col items-center gap-3 text-canvas/80
                      sm:flex-row sm:gap-0 sm:divide-x sm:divide-canvas/15
                    "
                >
                    {TRUST_ITEMS.map(({ icon, label }) => (
                        <li key={label} className="flex items-center gap-2 sm:px-5">
                            <span
                                className="
                                  flex items-center justify-center rounded-full bg-canvas/10 block-6
                                  inline-6
                                "
                            >
                                <HugeiconsIcon icon={icon} className="block-3.5 inline-3.5" />
                            </span>
                            {label}
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
