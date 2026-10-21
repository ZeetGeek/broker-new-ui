/**
 * Rewrites lucide-react imports (outside components/ui) to @/components/shared/icons.
 * Run: node scripts/migrate-lucide-to-shared-icons.mjs
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const skipDirs = new Set(["node_modules", ".git", ".next", "components/ui"]);

function shouldSkip(relPosix) {
    if (relPosix.startsWith("components/ui/") || relPosix === "components/ui") return true;
    if (relPosix.startsWith("scripts/")) return true;
    return false;
}

function walk(dir, out = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === "node_modules" || entry.name === ".git" || entry.name === ".next") {
            continue;
        }
        const full = path.join(dir, entry.name);
        const rel = path.relative(root, full).split(path.sep).join("/");
        if (entry.isDirectory()) {
            if (rel === "components/ui") continue;
            walk(full, out);
            continue;
        }
        if (!/\.(tsx?|jsx?)$/.test(entry.name)) continue;
        if (shouldSkip(rel)) continue;
        if (rel === "components/shared/icons.tsx") continue;
        out.push(full);
    }
    return out;
}

const files = walk(root);
let changed = 0;

for (const file of files) {
    let text = fs.readFileSync(file, "utf8");
    if (!text.includes("lucide-react")) continue;

    const next = text
        .replace(/from\s+["']lucide-react["']/g, 'from "@/components/shared/icons"')
        .replace(/\bLucideIcon\b/g, "AppIcon")
        .replace(/\bLucideProps\b/g, "IconProps");

    if (next !== text) {
        fs.writeFileSync(file, next, "utf8");
        changed++;
        console.log("updated", path.relative(root, file));
    }
}

console.log("Done. Files updated:", changed);
