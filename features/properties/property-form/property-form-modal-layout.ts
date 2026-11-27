import type { AppModalProps } from "@/components/shared/app-modal";

import styles from "./property-form.module.css";

export const propertyFormModalLayout = {
    size: "full",
    className: `
      inset-0 translate-none overflow-clip rounded-none border-0 p-0 shadow-none
      block-dvh inline-dvw max-block-none max-inline-none
      sm:inline-dvw sm:max-inline-none
      ${styles.fullscreen}
    `,
} satisfies Pick<AppModalProps, "size" | "className">;
