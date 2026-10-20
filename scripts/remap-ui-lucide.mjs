import fs from "node:fs";

const files = [
    "components/ui/select.tsx",
    "components/ui/input.tsx",
    "components/ui/combobox.tsx",
    "components/ui/accordion.tsx",
    "components/ui/pagination.tsx",
    "components/ui/dropdown-menu.tsx",
    "components/ui/dialog.tsx",
    "components/ui/calendar.tsx",
    "components/ui/breadcrumb.tsx",
];

for (const file of files) {
    let text = fs.readFileSync(file, "utf8");
    const next = text.replace(/from\s+["']lucide-react["']/g, 'from "@/components/shared/icons"');
    if (next !== text) {
        fs.writeFileSync(file, next, "utf8");
        console.log("updated", file);
    }
}
