"use client";

import type { MouseEvent } from "react";
import Link from "next/link";

import { openPersonDetails } from "@/lib/contacts/person-details-target";
import { formatPersonName } from "@/lib/format/person-name";
import { brokerContactHref, brokerContactNameHref } from "@/lib/routes/broker";
import { cn } from "@/lib/utils";

import { usePersonDetails } from "@/components/shared/person-details-context";

type ContactNameProps = {
    name: string;
    contactId?: string | null;
    contactType?: "buyer" | "owner";
    /** Existing profile destinations take precedence over CRM contact links. */
    href?: string;
    /** Keep existing local panels when one is already available. */
    onOpen?: () => void;
    className?: string;
    "data-contact-id"?: string;
    "data-card-title"?: boolean;
};

/** One display spelling and one click affordance for person names throughout the app. */
export function ContactName({
    name,
    contactId,
    contactType,
    href,
    onOpen,
    className,
    ...attributes
}: ContactNameProps) {
    const openShared = usePersonDetails();
    const displayName = formatPersonName(name);
    const destination =
        href ||
        (contactType && name.trim()
            ? contactId
                ? brokerContactHref(contactId, contactType)
                : brokerContactNameHref(name, contactType)
            : undefined);
    const shared = { ...attributes, className: cn("person-name", className), title: displayName };
    const stopCardClick = (event: MouseEvent) => event.stopPropagation();

    if (destination) {
        return (
            <Link
                {...shared}
                href={destination}
                prefetch={false}
                draggable={false}
                data-person-link
                aria-label={`View ${displayName}'s details`}
                onClick={stopCardClick}
                onNavigate={(event) => {
                    if (openPersonDetails(destination, name, onOpen, openShared))
                        event.preventDefault();
                }}
            >
                {displayName}
            </Link>
        );
    }
    if (onOpen) {
        return (
            <button
                {...shared}
                type="button"
                data-person-link
                aria-label={`View ${displayName}'s details`}
                onClick={(event) => {
                    stopCardClick(event);
                    onOpen();
                }}
            >
                {displayName}
            </button>
        );
    }
    return <span {...shared}>{displayName}</span>;
}
