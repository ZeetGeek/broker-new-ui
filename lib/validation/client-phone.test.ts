import assert from "node:assert/strict";
import test from "node:test";

import { formatPhoneIn, formatTelUrl, formatWhatsAppUrl } from "@/lib/format/phone";
import { createBuyerFormSchema } from "@/lib/validation/buyer";
import {
    clientCallingCode,
    clientPhoneForStorage,
    parseClientMobile,
} from "@/lib/validation/client-phone";

test("account countries provide dialling codes and fail closed when unavailable", () => {
    assert.equal(clientCallingCode("IN"), "+91");
    assert.equal(clientCallingCode("GB"), "+44");
    assert.equal(clientCallingCode("AE"), "+971");
    assert.equal(clientCallingCode("ZZ"), undefined);
    assert.equal(parseClientMobile("9876543210", undefined), undefined);
});

test("valid national and international mobiles match their exact country", () => {
    for (const [country, national, international] of [
        ["IN", "9876543210", "+919876543210"],
        ["GB", "07400123456", "+447400123456"],
        ["AE", "0501234567", "+971501234567"],
        ["US", "2133734253", "+12133734253"],
    ]) {
        assert.equal(parseClientMobile(national, country)?.number, international);
        assert.equal(parseClientMobile(international, country)?.number, international);
    }
});

test("reject foreign, shared-code foreign, malformed, landline and extension numbers", () => {
    assert.equal(parseClientMobile("+447911123456", "IN"), undefined);
    assert.equal(parseClientMobile("+12133734253", "CA"), undefined);
    assert.equal(parseClientMobile("1234", "IN"), undefined);
    assert.equal(parseClientMobile("Call +919876543210", "IN"), undefined);
    assert.equal(parseClientMobile("+442079460018", "GB"), undefined);
    assert.equal(parseClientMobile("+919876543210 ext 12", "IN"), undefined);
});

test("stored phone numbers survive formatting and contact actions", () => {
    assert.equal(clientPhoneForStorage("+919876543210", "IN"), "9876543210");
    const overseas = clientPhoneForStorage("0501234567", "AE");
    assert.equal(overseas, "+971501234567");
    assert.equal(formatTelUrl(overseas), "tel:+971501234567");
    assert.equal(formatWhatsAppUrl(overseas), "https://wa.me/971501234567");
    assert.equal(formatPhoneIn(overseas), overseas);
    assert.equal(formatWhatsAppUrl("+12423591234"), "https://wa.me/12423591234");
    assert.throws(() => clientPhoneForStorage("+447911123456", "IN"));
});

test("form schema enforces account country rather than editable form country", () => {
    const values = {
        name: "Test client",
        phone: "+971501234567",
        email: "",
        lookingFor: "buy",
        propertyKind: "any",
        country: "India",
        state: "Gujarat",
        city: "Surat",
        localities: "Vesu",
        saleBudgetMin: "",
        saleBudgetMax: "",
        rentBudgetMin: "",
        rentBudgetMax: "",
        bhk: "",
        source: "walk_in",
        note: "",
    };
    assert.equal(
        createBuyerFormSchema("AE", "United Arab Emirates").safeParse(values).success,
        true,
    );
    const rejected = createBuyerFormSchema("IN", "India").safeParse(values);
    assert.equal(rejected.success, false);
    if (!rejected.success)
        assert.ok(rejected.error.issues.some((issue) => issue.path[0] === "phone"));
});
