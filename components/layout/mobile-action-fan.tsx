import { useId } from "react";

import { type AppIcon, Plus } from "@/components/shared/icons";

import styles from "./mobile-action-fan.module.css";

export type MobileFanAction = {
    href: string;
    label: string;
    icon: AppIcon;
};

export function MobileActionFan({
    actions,
}: {
    actions: readonly [MobileFanAction, MobileFanAction, MobileFanAction, MobileFanAction];
}) {
    const id = useId();

    return (
        <div className={styles.fan}>
            <input
                className={styles.toggle}
                type="checkbox"
                id={id}
                aria-label="Quick actions"
                aria-controls={`${id}-actions`}
            />
            <label className={styles.trigger} htmlFor={id} title="Toggle quick actions">
                <Plus aria-hidden strokeWidth={2.25} />
            </label>
            <ul className={styles.actions} id={`${id}-actions`} aria-label="Quick actions">
                {actions.map(({ href, label, icon: Icon }) => (
                    <li className={styles.item} key={href}>
                        {/* Native navigation also resets the checkbox for query-only actions. */}
                        <a className={styles.action} href={href}>
                            <span className={styles.actionIcon}>
                                <Icon aria-hidden strokeWidth={1.75} />
                            </span>
                            <span className={styles.actionLabel}>{label}</span>
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
}
