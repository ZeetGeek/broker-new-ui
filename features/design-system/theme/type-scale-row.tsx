import { cn } from "@/lib/utils";

import type { TypeScaleStep } from "@/features/design-system/theme/type-scale";

export function TypeScaleRow({ step }: { step: TypeScaleStep }) {
    const Tag = step.element;
    const isEyebrow = step.token === "eyebrow";

    return (
        <div
            className="
              grid grid-cols-1 gap-3 border-be border-border-warm py-5
              last:border-be-0
              md:grid-cols-[140px_1fr] md:gap-6
            "
        >
            <div>
                <p className="body-sm font-medium text-ink">{step.name}</p>
                <code className="body-sm text-brand">{step.token}</code>
                <p className="body-sm tabular text-ink-subtle">
                    {step.mobilePx}px / {step.desktopPx}px
                </p>
                <p className="body-sm text-ink-subtle">
                    weight {step.weight} · tracking {step.tracking}
                </p>
            </div>
            <Tag className={cn("m-0", step.token, !isEyebrow && "text-ink")}>{step.sample}</Tag>
        </div>
    );
}
