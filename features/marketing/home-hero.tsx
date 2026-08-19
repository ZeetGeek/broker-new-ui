import {
    ArrowRight02Icon,
    MapPinIcon,
    RupeeIcon,
    Shield01Icon,
    SquareLock02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Logo } from "@/components/shared/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const TRUST_ITEMS = [
    { icon: Shield01Icon, label: "RERA-verified brokers" },
    { icon: RupeeIcon, label: "No listing fee" },
    { icon: SquareLock02Icon, label: "Your number stays private" },
];

export function HomeHero() {
    return (
        <section className="relative block-svh">
            <div className="absolute inset-0 bg-brand-ink" aria-hidden="true">
                {/* Background photo goes here — Indian mid-rise residential building at
                    dusk, or an empty flat interior. next/image, priority, blur placeholder. */}
                <div className="absolute inset-0 bg-brand-ink/75" />
            </div>

            <header className="
              absolute inset-x-0 inset-bs-0 z-10 flex items-center justify-between p-4
              md:p-6
            ">
                <Logo variant="inverse" />
                <nav className="flex items-center gap-2">
                    <Button variant="ghost" className="
                      text-canvas
                      hover:bg-white/10 hover:text-canvas
                    ">
                        Login
                    </Button>
                    <Button
                        variant="outline"
                        className="
                          border-white/30 bg-transparent text-canvas
                          hover:bg-white/10 hover:text-canvas
                        "
                    >
                        Sign up
                    </Button>
                </nav>
            </header>

            <div className="
              relative z-10 mx-auto flex flex-col items-center justify-center gap-6 px-4 text-center
              block-full max-inline-[560px]
            ">
                <Badge variant="brand" className="border border-brand/30 bg-brand/15 text-canvas">
                    <HugeiconsIcon icon={MapPinIcon} />
                    Now onboarding in Surat
                </Badge>

                <h1 className="
                  font-display text-[30px] leading-[1.12] font-semibold tracking-[-0.02em]
                  text-canvas
                  md:text-[56px]
                ">
                    Sell your property through a broker you trust.
                </h1>

                <p className="
                  text-[15px] leading-relaxed text-canvas/80 max-inline-[430px]
                  md:text-[16px]
                ">
                    List it free. Verified brokers ask to sell it. You approve the one you
                    like.
                </p>

                <div className="flex flex-col gap-2.5 inline-full sm:flex-row sm:inline-auto">
                    <Button
                        size="lg"
                        className="
                          bg-canvas text-brand-ink block-12 inline-full
                          hover:bg-canvas/85
                          sm:inline-auto
                        "
                    >
                        List my property free
                    </Button>
                    <Button
                        variant="outline"
                        size="lg"
                        className="
                          border-canvas/40 bg-transparent text-canvas block-12 inline-full
                          hover:bg-white/10 hover:text-canvas
                          sm:inline-auto
                        "
                    >
                        I&apos;m a broker
                        <HugeiconsIcon icon={ArrowRight02Icon} data-icon="inline-end" />
                    </Button>
                </div>

                <ul className="
                  flex flex-wrap items-center justify-center gap-4.5 text-[12px] text-canvas/70
                ">
                    {TRUST_ITEMS.map(({ icon, label }) => (
                        <li key={label} className="flex items-center gap-1.5">
                            <HugeiconsIcon icon={icon} className="block-3.5 inline-3.5" />
                            {label}
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
