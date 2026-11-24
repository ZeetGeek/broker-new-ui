import { FEATURE_SAVED_PROPERTIES } from "@/config";
import { SavedPropertiesSkeleton } from "@/features/properties/saved-properties/saved-properties-skeleton";

export default function Loading() {
    return FEATURE_SAVED_PROPERTIES ? <SavedPropertiesSkeleton /> : null;
}
