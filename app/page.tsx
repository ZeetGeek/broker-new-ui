import { HomeEntry } from "@/features/marketing/home-entry";
import { HomeHero } from "@/features/marketing/home-hero";

export default function Page() {
    return (
        <div className="bg-canvas p-1 block-svh">
            <HomeEntry>
                <HomeHero />
            </HomeEntry>
        </div>
    );
}
