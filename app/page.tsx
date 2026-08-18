import { Button } from "@/components/ui/button";

export default function Page() {
    return (
        <div className="flex p-6 min-block-svh">
            <div className="flex flex-col gap-4 text-sm/loose max-inline-md min-inline-0">
                <div>
                    <h1 className="text-2xl font-medium">Project ready!</h1>
                    <p>You may now add components and start building.</p>
                    <p>We&apos;ve already added the button component for you.</p>
                    <Button size="lg" className="mbs-2">
                        Button
                    </Button>
                </div>
                <div className="font-mono text-xs text-muted-foreground">
                    (Press <kbd>d</kbd> to toggle dark mode)
                </div>
            </div>
        </div>
    );
}
