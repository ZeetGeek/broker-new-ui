import assert from "node:assert/strict";
import test from "node:test";

import { personDetailsTarget } from "@/lib/contacts/person-details-target";
import { navigateWorkflow } from "@/lib/workflows/navigation";
import { workflowTarget } from "@/lib/workflows/target";

test("local panel handling takes precedence over shared workflow handling", () => {
    const actions: string[] = [];
    navigateWorkflow(
        { preventDefault: () => actions.push("prevent") },
        (event) => {
            actions.push("local");
            event.preventDefault();
        },
        () => {
            actions.push("shared");
            return true;
        },
        "/broker/properties/new",
    );
    assert.deepEqual(actions, ["local", "prevent"]);
});
test("ordinary recognized action links open a panel and prevent route navigation", () => {
    const actions: string[] = [];
    navigateWorkflow(
        { preventDefault: () => actions.push("prevent") },
        undefined,
        (href) => {
            actions.push(href);
            return true;
        },
        "/broker/tasks?view=create",
    );
    assert.deepEqual(actions, ["/broker/tasks?view=create", "prevent"]);
});
test("unrecognized links and missing providers retain their route fallback", () => {
    let prevented = false;
    const event = {
        preventDefault: () => {
            prevented = true;
        },
    };
    navigateWorkflow(event, undefined, () => false, "/broker/my-listings");
    navigateWorkflow(event, undefined, null, "/broker/tasks?view=create");
    navigateWorkflow(event, undefined, () => true, { pathname: "/broker/tasks" });
    assert.equal(prevented, false);
});

test("shared card links open a person on the same page without intercepting collection links", () => {
    const actions: string[] = [];
    const event = { preventDefault: () => actions.push("prevent") };
    const open = (href: string) => {
        const target = workflowTarget(href, "broker");
        if (target) actions.push(`workflow:${target.kind}`);
        return Boolean(target);
    };
    const openPerson = (href: string) => {
        const target = personDetailsTarget(href, "Rahul", "broker");
        if (target) actions.push(`person:${target.kind}`);
        return Boolean(target);
    };
    navigateWorkflow(event, undefined, open, "/broker/contacts?tab=buyers&contact=c1", openPerson);
    assert.deepEqual(actions.splice(0), ["person:contact", "prevent"]);
    navigateWorkflow(event, undefined, open, "/broker/contacts?add=buyer", openPerson);
    assert.deepEqual(actions.splice(0), ["workflow:contact", "prevent"]);
    navigateWorkflow(event, undefined, open, "/broker/contacts?tab=owners", openPerson);
    assert.deepEqual(actions, []);
});

test("an incumbent local panel also takes precedence over shared person panels", () => {
    const actions: string[] = [];
    navigateWorkflow(
        { preventDefault: () => actions.push("prevent") },
        (event) => event.preventDefault(),
        () => {
            actions.push("workflow");
            return false;
        },
        "/broker/contacts?contact=c1",
        () => {
            actions.push("person");
            return true;
        },
    );
    assert.deepEqual(actions, ["prevent"]);
});
