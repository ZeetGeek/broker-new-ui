import { Suspense } from "react";
import type { Metadata } from "next";

import { TasksPage } from "@/features/tasks/tasks-page";

export const metadata: Metadata = {
    title: "Tasks",
    robots: { index: false, follow: false },
};

export default function Page() {
    return (
        <Suspense>
            <TasksPage />
        </Suspense>
    );
}
