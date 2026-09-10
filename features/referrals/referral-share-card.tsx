"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

import { Check, Copy, MessageSquare, Share2, UserRoundPlus } from "lucide-react";

import { copyText } from "@/lib/clipboard";
import { buildSmsInviteUrl, buildWhatsAppInviteUrl } from "@/lib/share/referral";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

import { buildInviteMessage } from "@/features/referrals/referral-meta";
import { REFERRAL_REWARD_CREDITS, type ReferralCode } from "@/features/referrals/types";

type ReferralShareCardProps = {
    referralCode: ReferralCode | null;
    inviterName: string;
    onInvite: () => void;
    className?: string;
};

/**
 * `navigator.share` never changes for the life of a page, so the store has
 * nothing to subscribe to. Defined at module scope so the reference is stable
 * — a new function each render would make the store resubscribe forever.
 */
function subscribeToNothing(): () => void {
    return () => {};
}

/** Code display + copy, as one pressable unit. */
function CodeField({ code, shareUrl }: { code: string; shareUrl: string }) {
    const [copied, setCopied] = useState(false);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        if (!copied && !failed) return;
        const timer = window.setTimeout(() => {
            setCopied(false);
            setFailed(false);
        }, 2000);
        return () => window.clearTimeout(timer);
    }, [copied, failed]);

    const handleCopy = useCallback(async () => {
        const ok = await copyText(shareUrl);
        setCopied(ok);
        setFailed(!ok);
    }, [shareUrl]);

    return (
        <div className="flex flex-col gap-2">
            <p className="eyebrow text-white/55">Your invite code</p>

            <div
                className="
                  flex items-center gap-2 rounded-inner border border-white/12 bg-white/8 p-1.5 ps-4
                "
            >
                {/* The code, not the URL. A broker reads a code out over the
                    phone; nobody reads a URL out over the phone. */}
                <span className="body-lg tabular flex-1 font-semibold tracking-wide text-white">
                    {code}
                </span>

                <Button
                    variant="highlight"
                    size="sm"
                    onClick={handleCopy}
                    // The label carries the state; a bare icon swap is
                    // invisible to a screen reader. docs/MESSAGES.md.
                    aria-live="polite"
                >
                    {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
                    {copied ? "Copied" : "Copy link"}
                </Button>
            </div>

            {failed ? (
                <p role="alert" className="body-xs text-white/70">
                    Copying did not work on this phone. Press and hold the code to copy it.
                </p>
            ) : (
                <p className="body-xs break-all text-white/45">{shareUrl}</p>
            )}
        </div>
    );
}

/**
 * The dark attention card (docs/DESIGN.md §1.1) — the one thing on the page
 * the broker is meant to act on, so it gets the one dark panel and the one
 * lime button.
 *
 * Sharing is offered three ways because the broker's contact is reached three
 * ways: WhatsApp is how business is actually done here, SMS is the fallback
 * for a number not on WhatsApp, and the code covers reading it out loud. The
 * separate "Invite by number" opens the tracked path — anything shared as a
 * bare link cannot be attributed to a person until they sign up.
 */
export function ReferralShareCard({
    referralCode,
    inviterName,
    onInvite,
    className,
}: ReferralShareCardProps) {
    // Feature detection that has to differ between server and client without
    // tripping hydration. `useSyncExternalStore` is the supported way to say
    // "false on the server, the real answer once mounted"; an effect writing
    // state would cascade a second render on every mount of this card.
    const canNativeShare = useSyncExternalStore(
        subscribeToNothing,
        () => typeof navigator !== "undefined" && typeof navigator.share === "function",
        () => false,
    );

    if (!referralCode) return null;

    const message = buildInviteMessage({ inviterName, shareUrl: referralCode.shareUrl });

    const handleNativeShare = async () => {
        try {
            await navigator.share({ text: message, url: referralCode.shareUrl });
        } catch {
            // The user dismissed the sheet, or the browser refused. Neither is
            // an error worth interrupting them over.
        }
    };

    return (
        <section
            className={cn(
                // Dark panels carry no shadow — they separate by fill.
                // docs/DESIGN.md §3.3.
                "flex flex-col gap-5 rounded-card bg-brand-deep p-4 sm:p-5",
                className,
            )}
            aria-labelledby="referral-share-heading"
        >
            <div className="flex flex-col gap-1.5">
                <h2 id="referral-share-heading" className="h5 text-white">
                    Invite someone you trust
                </h2>
                <p className="body-sm text-white/60">
                    Anyone who joins with your code earns you credits —{" "}
                    {REFERRAL_REWARD_CREDITS.broker} for a broker once an owner accepts them,{" "}
                    {REFERRAL_REWARD_CREDITS.owner} for an owner once they list.
                </p>
            </div>

            <CodeField code={referralCode.code} shareUrl={referralCode.shareUrl} />

            <div className="flex flex-wrap gap-2">
                <Button
                    variant="highlight"
                    size="md"
                    nativeButton={false}
                    render={
                        <a
                            href={buildWhatsAppInviteUrl(message)}
                            target="_blank"
                            rel="noreferrer noopener"
                        />
                    }
                >
                    <MessageSquare aria-hidden />
                    Share on WhatsApp
                </Button>

                <Button
                    variant="outline-dark"
                    size="md"
                    className="border-white/25 text-white hover:bg-white/10"
                    onClick={onInvite}
                >
                    <UserRoundPlus aria-hidden />
                    Invite by number
                </Button>

                {canNativeShare ? (
                    <Button
                        variant="ghost"
                        size="icon-md"
                        className="text-white/70 hover:bg-white/10 hover:text-white"
                        aria-label="Share your invite link another way"
                        onClick={handleNativeShare}
                    >
                        <Share2 aria-hidden />
                    </Button>
                ) : (
                    <Button
                        variant="ghost"
                        size="md"
                        className="text-white/70 hover:bg-white/10 hover:text-white"
                        nativeButton={false}
                        render={<a href={buildSmsInviteUrl(message)} />}
                    >
                        Send by SMS
                    </Button>
                )}
            </div>
        </section>
    );
}
