import assert from "node:assert/strict";
import test from "node:test";

import { summarizeAttachedClients } from "@/lib/format/attached-clients";

const clients = [
    { id: "1", name: "Ramesh Patel", avatarUrl: "/ramesh.jpg" },
    { id: "2", name: "Zeet Patel", avatarUrl: "/zeet.jpg" },
    { id: "3", name: "Shivendra", avatarUrl: "/shivendra.jpg" },
];

test("one client is represented by their name and their actual avatar", () => {
    const summary = summarizeAttachedClients(clients.slice(0, 1));
    assert.equal(summary.label, "Ramesh Patel");
    assert.deepEqual(summary.visibleClients, [clients[0]]);
});

test("two or more clients show two avatars with the full count", () => {
    for (const count of [2, 3]) {
        const summary = summarizeAttachedClients(clients.slice(0, count));
        assert.equal(summary.label, `${count} clients`);
        assert.deepEqual(summary.visibleClients, clients.slice(0, 2));
        assert.equal(summary.total, count);
    }
});

test("saved and new selections cannot inflate the client count", () => {
    const summary = summarizeAttachedClients([clients[0]!, clients[0]!, clients[1]!]);
    assert.equal(summary.label, "2 clients");
    assert.equal(summary.visibleClients.length, 2);
});

test("an empty selection has no visible avatars", () => {
    const summary = summarizeAttachedClients([]);
    assert.equal(summary.total, 0);
    assert.deepEqual(summary.visibleClients, []);
});
