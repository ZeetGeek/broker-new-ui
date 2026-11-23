import { useId, useRef } from "react";

import { type AppIcon, Plus } from "@/components/shared/icons";
import { WorkflowLink } from "@/components/shared/workflow-link";

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
    const toggle = useRef<HTMLInputElement>(null);

    return (
        <div className={styles.fan}>
            <input
                ref={toggle}
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
                        <WorkflowLink
                            className={styles.action}
                            href={href}
                            onClick={() => {
                                if (toggle.current) toggle.current.checked = false;
                            }}
                        >
                            <span className={styles.actionIcon}>
                                <Icon aria-hidden strokeWidth={1.75} />
                            </span>
                            <span className={styles.actionLabel}>{label}</span>
                        </WorkflowLink>
                    </li>
                ))}
            </ul>
        </div>
    );
}
