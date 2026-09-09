import { cn } from "@/lib/utils";

import { REFERRAL_EARNING_RULES, REFERRAL_ROLE_ICON } from "@/features/referrals/referral-meta";
import { LISTING_COST_CREDITS } from "@/features/referrals/types";

/**
 * The rules of the programme, stated once and in full.
 *
 * Both rules name the *whole* chain rather than stopping at "they sign up",
 * because the gap between signing up and qualifying is exactly where a
 * referral programme loses people's trust. A broker who was promised credits
 * on signup and got none has been misled, even if nobody meant to.
 *
 * The spend line is here too. Credits nobody can use are not a reward, and
 * this is the only place the page says what they are for.
 */
export function HowToEarnCard({ className }: { className?: string }) {
    return (
        <section
            className={cn(
                "flex flex-col gap-4 rounded-card border border-border-warm bg-surface p-4 sm:p-5",
                className,
            )}
            aria-labelledby="how-to-earn-heading"
        >
            <div className="flex flex-col gap-1">
                <h2 id="how-to-earn-heading" className="h6 text-ink">
                    How you earn
                </h2>
                {/* The absence of a threshold is worth stating outright — most
                    referral schemes have one, so a broker will assume this does
                    until told otherwise. */}
                <p className="body-sm text-ink-muted">
                    Every person, every time. There is no minimum to reach first.
                </p>
            </div>

            <ul className="flex flex-col gap-3">
                {REFERRAL_EARNING_RULES.map((rule) => {
                    const Icon = REFERRAL_ROLE_ICON[rule.role];

                    return (
                        <li key={rule.role} className="flex items-start gap-3">
                            <span
                                aria-hidden
                                className="
                                  flex shrink-0 items-center justify-center rounded-full
                                  bg-brand-soft text-brand-text block-8 inline-8
                                "
                            >
                                <Icon className="block-4 inline-4" strokeWidth={1.75} />
                            </span>

                            <p className="body-sm flex-1 text-ink-muted min-inline-0">
                                {rule.label}
                            </p>

                            <span className="body-sm tabular shrink-0 font-semibold text-brand">
                                +{rule.credits}
                            </span>
                        </li>
                    );
                })}
            </ul>

            <p className="body-xs border-bs border-border-warm pbs-3 text-ink-subtle">
                Credits are spent inside {/* no rupee figure: credits are not money */}
                the app — publishing one listing costs {LISTING_COST_CREDITS}. They cannot be
                withdrawn as cash.
            </p>
        </section>
    );
}
