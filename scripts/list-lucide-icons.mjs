import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const icons = new Set();

function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === "node_modules" || entry.name === ".git" || entry.name === ".next") {
            continue;
        }
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walk(full);
            continue;
        }
        if (!/\.(tsx?|jsx?)$/.test(entry.name)) continue;
        const text = fs.readFileSync(full, "utf8");
        const re = /import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+["']lucide-react["']/g;
        let match;
        while ((match = re.exec(text))) {
            for (const part of match[1].split(",")) {
                let name = part.trim();
                if (!name) continue;
                name = name.replace(/^type\s+/, "").split(/\s+as\s+/)[0].trim();
                if (name) icons.add(name);
            }
        }
    }
}

walk(root);
console.log([...icons].sort().join("\n"));
console.log("TOTAL", icons.size);
