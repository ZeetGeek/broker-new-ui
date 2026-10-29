import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

test("only an explicit true enables owner features in a fresh process", () => {
    const configUrl = new URL("../../config/index.ts", import.meta.url).href;
    for (const value of [undefined, "", "false", "TRUE", "unexpected", "true"]) {
        const env = { ...process.env };
        if (value === undefined) delete env.NEXT_PUBLIC_FEATURE_PLATFORM_OWNER;
        else env.NEXT_PUBLIC_FEATURE_PLATFORM_OWNER = value;
        const result = execFileSync(
            process.execPath,
            [
                "--import",
                "tsx",
                "--input-type=module",
                "--eval",
                `import { FEATURE_PLATFORM_OWNER } from ${JSON.stringify(configUrl)}; console.log(FEATURE_PLATFORM_OWNER);`,
            ],
            { env, encoding: "utf8", windowsHide: true },
        ).trim();
        assert.equal(result, String(value === "true"), `environment value: ${String(value)}`);
    }
});
