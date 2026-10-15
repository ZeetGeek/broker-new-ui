"use client";

import Link from "next/link";

import { addCollection, Icon } from "@iconify/react/offline";
import { MapPin, Phone } from "lucide-react";

import { formatIndianPrice } from "@/lib/format/price";
import { formatPhoneIn, formatWhatsAppUrl } from "@/lib/format/phone";
import { cn } from "@/lib/utils";

import { PropertyThumb } from "@/components/shared/property-thumb";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";

import { ownerRequestDetailHref } from "@/features/owner-requests/map-owner-request";
import type { OwnerRequestCardItem } from "@/features/owner-requests/types";
import whatsappIcons from "@/features/properties/my-requests/bi-whatsapp.json";

addCollection(whatsappIcons as Parameters<typeof addCollection>[0]);

function listingPriceLabel(item: OwnerRequestCardItem): string {
    if (!item.amountInr) return "Price on request";
    return formatIndianPrice(item.amountInr, item.isRent ? "rent" : "buy");
}

function listingPlace(item: OwnerRequestCardItem): string {
    return [item.locality, item.city].filter(Boolean).join(", ") || "Surat";
}

export function ActiveBrokerCard({ item }: { item: OwnerRequestCardItem }) {
    const detailsHref = ownerRequestDetailHref(item.propertyId);
    const hasPhone = Boolean(item.brokerPhoneDigits);

    return (
        <article
            className={cn(
                `
                  contact-card group/card relative flex h-full flex-col gap-3 rounded-card border
                  border-border-warm bg-surface p-4 shadow-md transition-[box-shadow] duration-160
                  hover:shadow-lg
                `,
            )}
        >
            <div className="flex items-start gap-3 min-inline-0">
                <UserAvatar
                    name={item.brokerName}
                    imageUrl={item.brokerAvatarUrl}
                    size="md"
                    fallback="shape"
                    className="shrink-0"
                />
                <div className="min-inline-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <h2 className="body truncate font-bold capitalize text-ink">
                            {item.brokerName}
                        </h2>
                        {item.brokerVerified ? (
                            <span className="body-xs shrink-0 rounded-md bg-brand-soft px-1.5 py-0.5 font-semibold text-brand-text">
                                Verified
                            </span>
                        ) : null}
                    </div>
                    {hasPhone ? (
                        <a
                            href={`tel:+91${item.brokerPhoneDigits}`}
                            className="body-sm mbs-0.5 block truncate tabular text-ink-muted hover:text-brand-text"
                        >
                            {formatPhoneIn(item.brokerPhoneDigits!)}
                        </a>
                    ) : item.brokerOrgName ? (
                        <p className="body-sm mbs-0.5 truncate text-ink-muted">
                            {item.brokerOrgName}
                        </p>
                    ) : null}
                </div>
            </div>

            <div className="flex flex-1 flex-col gap-1.5 min-inline-0">
                <p className="h5 truncate font-semibold tabular text-brand">
                    {listingPriceLabel(item)}
                </p>
                <p className="body-sm truncate text-ink-muted">{item.title}</p>
                <p className="body-sm flex items-center gap-1.5 truncate text-ink-subtle">
                    <MapPin
                        aria-hidden
                        className="shrink-0 block-3.5 inline-3.5"
                        strokeWidth={1.75}
                    />
                    <span className="truncate">{listingPlace(item)}</span>
                </p>
            </div>

            <footer className="mt-auto flex flex-col gap-2.5">
                <Link
                    href={detailsHref}
                    prefetch={false}
                    className="
                      flex items-center justify-between gap-2 rounded-inner border border-border-warm
                      bg-surface-muted/60 px-2.5 py-2 transition-colors duration-160
                      hover:bg-surface-muted
                    "
                >
                    <span className="flex items-center gap-2 min-inline-0">
                        <PropertyThumb
                            src={item.imageSrc}
                            alt=""
                            hoverScale={false}
                            sizes="36px"
                            iconClassName="block-4 inline-4"
                            sizeClassName="block-9 inline-9"
                            className="rounded-[8px] shadow-xs ring-2 ring-surface"
                        />
                        <span className="body-sm truncate font-medium text-ink">1 property</span>
                    </span>
                    <span className="body-xs shrink-0 font-semibold text-brand">View</span>
                </Link>

                <div className="grid grid-cols-2 gap-2">
                    {hasPhone ? (
                        <>
                            <Button
                                size="md"
                                variant="outline"
                                type="button"
                                className="inline-full"
                                nativeButton={false}
                                render={
                                    <a
                                        href={`tel:+91${item.brokerPhoneDigits}`}
                                        aria-label={`Call ${item.brokerName}`}
                                    />
                                }
                            >
                                <Phone
                                    aria-hidden
                                    className="block-4 inline-4"
                                    strokeWidth={1.75}
                                />
                                Call
                            </Button>
                            <Button
                                size="md"
                                variant="accent"
                                type="button"
                                className="inline-full"
                                nativeButton={false}
                                render={
                                    <a
                                        href={formatWhatsAppUrl(item.brokerPhoneDigits!)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={`Message ${item.brokerName} on WhatsApp`}
                                    />
                                }
                            >
                                <Icon
                                    icon="bi:whatsapp"
                                    width={16}
                                    height={16}
                                    className="block-4 inline-4"
                                    aria-hidden
                                />
                                WhatsApp
                            </Button>
                        </>
                    ) : (
                        <Button
                            size="md"
                            variant="accent"
                            type="button"
                            className="col-span-2 inline-full"
                            nativeButton={false}
                            render={<Link href={detailsHref} prefetch={false} />}
                        >
                            View property
                        </Button>
                    )}
                </div>
            </footer>
        </article>
    );
}
