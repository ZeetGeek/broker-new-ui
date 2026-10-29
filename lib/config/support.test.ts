import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

import { supportWhatsAppUrl } from "../../config/constants";

test("support is unavailable without a valid configured international number", () => {
    for (const value of [
        undefined,
        "",
        " ",
        "123",
        "0123456789",
        "https://example.com",
        "1234567890123456",
    ]) {
        assert.equal(supportWhatsAppUrl(value), null);
    }
    assert.equal(supportWhatsAppUrl(" +14155552671 "), "https://wa.me/14155552671");
});

test("an absent support setting never falls back to a placeholder", () => {
    const output = execFileSync(
        process.execPath,
        [
            "--import",
            "tsx",
            "--input-type=module",
            "--eval",
            "import { SUPPORT_WHATSAPP_URL } from './config/constants.ts'; console.log(JSON.stringify(SUPPORT_WHATSAPP_URL));",
        ],
        {
            env: { ...process.env, NEXT_PUBLIC_SUPPORT_WHATSAPP_E164: "" },
            encoding: "utf8",
        },
    );
    assert.equal(JSON.parse(output.trim()), null);
    for (const path of [
        "features/broker/profile-menu.tsx",
        "features/dashboard/owner-profile-menu.tsx",
    ]) {
        assert.match(readFileSync(path, "utf8"), /SUPPORT_WHATSAPP_URL\s*\?/);
    }
});
