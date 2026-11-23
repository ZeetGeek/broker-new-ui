import assert from "node:assert/strict";
import test from "node:test";

import { isWorkingWorkflow, workflowTarget } from "@/lib/workflows/target";

test("collection navigation and unsupported destinations remain full pages", () => {
    for (const href of [
        "/broker/dashboard",
        "/broker/contacts",
        "/broker/my-listings",
        "/broker/visits",
        "/broker/tasks",
        "/broker/pipeline",
        "/broker/my-listings/one/analytics",
        "/broker/properties/one?tab=analytics",
        "/broker/properties",
        "https://external.test/broker/properties/new",
    ]) {
        assert.equal(workflowTarget(href, "broker"), null, href);
    }
    assert.equal(workflowTarget("/broker/tasks?view=create", "owner"), null);
});
test("creation links reuse explicit action targets", () => {
    assert.deepEqual(workflowTarget("/broker/contacts?add=buyer", "broker"), {
        kind: "contact",
        mode: "create-client",
    });
    assert.deepEqual(workflowTarget("/broker/contacts?add=owner", "broker"), {
        kind: "contact",
        mode: "create-owner",
    });
    assert.deepEqual(workflowTarget("/broker/properties/new", "broker"), {
        kind: "property",
        mode: "create",
    });
    assert.equal(workflowTarget("/broker/contacts?flow=add-deal", "broker"), null);
    assert.equal(workflowTarget("/broker/tasks?view=edit", "broker"), null);
});
test("property details stay full pages across both portals and listing sources", () => {
    for (const portal of ["broker", "owner"] as const) {
        for (const href of [
            "/broker/properties/property-1",
            "/broker/properties/property-1/",
            "/broker/properties/property-1?from=saved#photos",
            "/broker/properties/person%2F1%3Fextra%3Dtrue",
            "/broker/owner-listings/property-1",
            "/owner/properties/property-1",
            "/property/property-1",
        ]) {
            assert.equal(workflowTarget(href, portal), null, `${portal}: ${href}`);
        }
    }
});
test("record identities are decoded once without query injection", () => {
    const id = "person/1?extra=true&other=value";
    const task = workflowTarget(
        `/broker/tasks?view=detail&task=${encodeURIComponent(id)}`,
        "broker",
    );
    assert.equal(task?.kind, "task");
    assert.equal(task && "id" in task ? task.id : null, id);
    const property = workflowTarget(`/broker/properties/${encodeURIComponent(id)}/edit`, "broker");
    assert.deepEqual(property, { kind: "property", mode: "edit", id });
    assert.deepEqual(
        workflowTarget(`/broker/pipeline/${encodeURIComponent(id)}?action=note`, "broker"),
        { kind: "deal", mode: "note", id },
    );
});
test("visit scheduling preserves pipeline context and sample details cannot become live appointments", () => {
    const target = workflowTarget(
        "/broker/visits?schedule=1&clientId=c&propertyId=p&leadId=l",
        "broker",
    );
    assert.deepEqual(target, {
        kind: "visit",
        mode: "schedule",
        intent: { clientId: "c", propertyId: "p", leadId: "l" },
    });
    const sample = workflowTarget(
        "/broker/visits?view=detail&visit=visit-1&preview=true",
        "broker",
    );
    assert.equal(sample?.kind === "visit" && sample.preview, true);
    assert.equal(sample?.kind === "visit" && sample.id, "visit-1");
    const direct = workflowTarget("/broker/visits?visit=real-1", "broker");
    assert.equal(direct?.mode, "detail");
});
test("follow-up tasks retain contextual fields and detail panels do not inherit a form lock", () => {
    const target = workflowTarget(
        "/broker/tasks?view=create&visitClient=c&visitProperty=p&visitTitle=Call+after+visit",
        "broker",
    );
    assert.equal(target?.kind === "task" && target.prefill.clientId, "c");
    assert.equal(target?.kind === "task" && target.prefill.propertyId, "p");
    assert.equal(target?.kind === "task" && target.prefill.title, "Call after visit");
    assert.equal(isWorkingWorkflow({ kind: "deal", mode: "detail", id: "one" }), false);
    assert.equal(isWorkingWorkflow({ kind: "property", mode: "create" }), true);
});
