import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

test("one environment setting renames both runtime naming imports", () => {
    const output = execFileSync(
        process.execPath,
        [
            "--import",
            "tsx",
            "--input-type=module",
            "--eval",
            `
        import { APP_NAME } from './config/index.ts';
        import { SITE_NAME } from './config/site.ts';
        console.log(JSON.stringify([APP_NAME, SITE_NAME]));
    `,
        ],
        {
            cwd: process.cwd(),
            env: { ...process.env, NEXT_PUBLIC_APP_NAME: "Rename QA" },
            encoding: "utf8",
        },
    );
    assert.deepEqual(JSON.parse(output.trim()), ["Rename QA", "Rename QA"]);
});
