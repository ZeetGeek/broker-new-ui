import { myListingsApi } from "@/lib/api/my-listings";

import toast from "@/components/shared/app-toast";

/** Undo uses the same restore operation as Deleted: the property returns as a draft. */
export function showPropertyRemovedToast(propertyId: string, onRestored: () => void) {
    return toast.message("property-removed", {
        id: `property-deleted-${propertyId}`,
        description: "You can restore this property as a draft.",
        action: {
            label: "Undo",
            onClick: () => {
                void myListingsApi.restore(propertyId).then(
                    () => {
                        toast.message("property-restored");
                        onRestored();
                    },
                    (error: unknown) => {
                        toast.error("Could not restore property", {
                            description:
                                error instanceof Error
                                    ? error.message
                                    : "Open Deleted and try again.",
                        });
                    },
                );
            },
        },
    });
}
