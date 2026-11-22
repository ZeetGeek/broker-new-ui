import { formatPersonName } from "@/lib/format/person-name";
import { cn } from "@/lib/utils";

import { peoplePersonTrailingBadge, peopleRoleLabel } from "@/components/shared/people-person-meta";
import type { PeoplePickerPerson } from "@/components/shared/people-picker";
import { PEOPLE_ROLE_DOT_CLASS } from "@/components/shared/people-role-dot";
import { PhoneNumber } from "@/components/shared/phone-number";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";

/**
 * Shared face for PeopleInlineSelect rows and caret `@` mention lists.
 * Name + phone only — never locality / address / requirement text.
 */
export function PeopleOptionRow({
    person,
    showRolePip = true,
    className,
}: {
    person: PeoplePickerPerson;
    /** When All / both roles are mixed — color pip instead of a Client/Owner chip. */
    showRolePip?: boolean;
    className?: string;
}) {
    const name = formatPersonName(person.name);
    const trailing = peoplePersonTrailingBadge(person);
    const phone = person.phoneDigits?.replace(/\D/g, "") || undefined;

    return (
        <span className={cn("flex items-center gap-3 inline-full min-inline-0", className)}>
            {showRolePip ? (
                <span
                    className={cn(
                        "shrink-0 rounded-full block-2 inline-2",
                        person.role === "owner"
                            ? PEOPLE_ROLE_DOT_CLASS.owner
                            : PEOPLE_ROLE_DOT_CLASS.client,
                    )}
                    title={peopleRoleLabel(person.role)}
                    aria-hidden
                />
            ) : null}
            {showRolePip ? <span className="sr-only">{peopleRoleLabel(person.role)}</span> : null}
            <UserAvatar name={name} imageUrl={person.imageUrl} size="sm" />
            <span className="flex flex-1 flex-col gap-1 min-inline-0">
                <span className="body-sm truncate font-semibold text-ink">{name}</span>
                {phone ? (
                    <span className="body-xs truncate text-ink-muted">
                        <PhoneNumber phoneDigits={phone} />
                    </span>
                ) : null}
            </span>
            {trailing ? (
                <Badge color={trailing.color} className="shrink-0">
                    {trailing.label}
                </Badge>
            ) : null}
        </span>
    );
}
