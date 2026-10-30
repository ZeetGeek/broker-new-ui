import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("authentication completion and transport do not print authentication responses", () => {
    for (const path of [
        "features/auth/google-role-picker-panel.tsx",
        "lib/api/auth.ts",
        "lib/api/client.ts",
        "store/slices/auth-slice.ts",
    ]) {
        assert.doesNotMatch(
            readFileSync(path, "utf8"),
            /console\s*\.\s*(?:log|debug|info|warn|error|dir|table)\s*\(/,
            path,
        );
    }
});
