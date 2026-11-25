import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

import { api } from "@/lib/api/client";
import { clientsApi, type NewBuyerInput, PartialClientAttachError } from "@/lib/api/clients";

const input: NewBuyerInput = {
    name: "rahul mehta",
    phoneDigits: "9876543210",
    email: null,
    notes: null,
    lookingFor: "both",
    propertyKind: "apartment",
    preferredLocalities: ["Vesu"],
    country: "India",
    state: "Gujarat",
    city: "Surat",
    budgetMinInr: 5000000,
    budgetMaxInr: 9000000,
    rentBudgetMinInr: 15000,
    rentBudgetMaxInr: 25000,
    bhk: 2,
    source: "referral",
};

test("client updates explicitly clear email and notes while preserving requirements; creation stays optional", async (t) => {
    const previous = api.defaults.adapter;
    t.after(() => {
        api.defaults.adapter = previous;
    });
    const payloads: Record<string, unknown>[] = [];
    api.defaults.adapter = async (config) => {
        const payload = JSON.parse(String(config.data));
        payloads.push(payload);
        return {
            data: { id: "client-1", ...payload },
            status: 200,
            statusText: "OK",
            headers: {},
            config,
        };
    };
    await clientsApi.update("client-1", input);
    assert.equal(payloads[0].email, null);
    assert.equal(payloads[0].notes, null);
    assert.equal(payloads[0].name, input.name);
    assert.equal(payloads[0].clientType, "both");
    assert.equal(payloads[0].budgetMax, input.budgetMaxInr);
    assert.equal(payloads[0].rentBudgetMax, input.rentBudgetMaxInr);
    assert.deepEqual(payloads[0].preferredLocalities, ["Vesu"]);
    await clientsApi.create(input);
    assert.equal(Object.hasOwn(payloads[1], "email"), false);
    assert.equal(Object.hasOwn(payloads[1], "notes"), false);
    await clientsApi.update("client-1", { ...input, email: undefined, notes: undefined });
    assert.equal(Object.hasOwn(payloads[2], "email"), false);
    assert.equal(Object.hasOwn(payloads[2], "notes"), false);
});

test("link batches settle every request and identify successes separately from failures", async (t) => {
    const previous = api.defaults.adapter;
    t.after(() => {
        api.defaults.adapter = previous;
    });
    const completed: string[] = [];
    api.defaults.adapter = async (config) => {
        const { propertyId, clientIds } = JSON.parse(String(config.data));
        assert.deepEqual(clientIds, ["client-1"]);
        if (propertyId === "bad") throw new Error("Simulated link failure");
        await new Promise((resolve) => setTimeout(resolve, 15));
        completed.push(propertyId);
        return {
            data: { items: [], attached: 1 },
            status: 200,
            statusText: "OK",
            headers: {},
            config,
        };
    };
    await assert.rejects(
        clientsApi.attachClientToProperties("client-1", ["good", "bad", "good", "also-good"]),
        (error) => {
            assert.ok(error instanceof PartialClientAttachError);
            assert.deepEqual(error.attachedPropertyIds, ["good", "also-good"]);
            assert.deepEqual(error.failedPropertyIds, ["bad"]);
            assert.deepEqual(completed.sort(), ["also-good", "good"]);
            return true;
        },
    );
});

test(
    "sample owner edits and property links persist in the shared stores without changing existing deals",
    { timeout: 30_000 },
    () => {
        const script = `
        const assert = await import('node:assert/strict');
        const values = new Map([['crm.test-lab.v1', JSON.stringify({source:'sample',volume:'more',account:'new',network:'online',portal:'broker'})]]);
        globalThis.sessionStorage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
        globalThis.localStorage=sessionStorage; globalThis.window={sessionStorage,localStorage};
        const {contactsApi}=await import('./lib/api/contacts.ts');
        const {clientsApi}=await import('./lib/api/clients.ts');
        const {exclusiveOwnersApi,canEditExclusiveOwners}=await import('./lib/api/exclusive-owners.ts');
        const {propertiesApi}=await import('./lib/api/properties.ts');
        const {pipelineApi}=await import('./lib/api/pipeline.ts');
        const {updateOwnerContact}=await import('./lib/contacts/contact-actions.ts');
        const {DEFAULT_CONTACTS_FILTERS}=await import('./features/contacts/types.ts');
        const {MOCK_DEALS}=await import('./features/pipeline/mock-deals.ts');
        const owners=await contactsApi.listOwnersPage({...DEFAULT_CONTACTS_FILTERS,tab:'owners'},null);
        const owner=owners.items[0];
        assert.ok(canEditExclusiveOwners());
        const initialProperties=owner.properties.map(p=>p.id);
        await updateOwnerContact(owner,{notes:'Updated owner note'});
        const reloadedOwner=await contactsApi.findContact(owner.id,'owner');
        assert.equal(reloadedOwner.row.notes,'Updated owner note');
        assert.deepEqual(reloadedOwner.row.properties.map(p=>p.id),initialProperties);
        await updateOwnerContact(reloadedOwner.row,{notes:''});
        assert.equal((await contactsApi.findContact(owner.id,'owner')).row.details.notes,'');
        const other=owners.items[1];
        await propertiesApi.attachExclusiveOwner(initialProperties[0],other.id);
        assert.equal((await propertiesApi.get(initialProperties[0])).exclusiveOwnerId,other.id);
        assert.ok(!(await contactsApi.findContact(owner.id,'owner')).row.properties?.some(p=>p.id===initialProperties[0]));
        assert.ok((await contactsApi.findContact(other.id,'owner')).row.properties.some(p=>p.id===initialProperties[0]));
        const buyer=(await contactsApi.listBuyersPage(DEFAULT_CONTACTS_FILTERS,null)).items[0];
        const oldIds=buyer.attachedProperties.map(p=>p.id);
        const beforeDeals=MOCK_DEALS.map(d=>({id:d.id,status:d.status}));
        await clientsApi.attachClientToProperties(buyer.id,[initialProperties[0],initialProperties[0]]);
        let changed=await contactsApi.findContact(buyer.id,'buyer');
        const linked=changed.row.attachedProperties.find(p=>p.id===initialProperties[0]);
        assert.ok(linked,'new link appears on contact');
        assert.ok(MOCK_DEALS.some(d=>d.id===linked.leadId && d.status==='new'),'same link exists in Pipeline');
        assert.equal((await pipelineApi.get(linked.leadId)).buyer.id,buyer.id);
        assert.ok(oldIds.every(id=>changed.row.attachedProperties.some(p=>p.id===id)),'existing links remain');
        for(const old of beforeDeals) assert.equal(MOCK_DEALS.find(d=>d.id===old.id).status,old.status);
        await clientsApi.attachClientToProperties(buyer.id,[initialProperties[0]]);
        changed=await contactsApi.findContact(buyer.id,'buyer');
        assert.equal(changed.row.attachedProperties.filter(p=>p.id===initialProperties[0]).length,1);
        assert.ok((await clientsApi.listForProperty(initialProperties[0])).attachedIds.includes(buyer.id));
        await clientsApi.removeLead(linked.leadId);
        assert.ok(!(await contactsApi.findContact(buyer.id,'buyer')).row.attachedProperties.some(p=>p.id===initialProperties[0]));
        const sortedOwners=await contactsApi.listOwnersPage({...DEFAULT_CONTACTS_FILTERS,tab:'owners',sort:'name'},null);
        assert.ok(sortedOwners.items.every((x,i,a)=>i===0||a[i-1].name.localeCompare(x.name)<=0));
        const expectedClients=(await clientsApi.list()).sort((a,b)=>a.name.localeCompare(b.name));
        const sortedClients=await contactsApi.listBuyersPage({...DEFAULT_CONTACTS_FILTERS,sort:'name'},null);
        assert.deepEqual(sortedClients.items.map(x=>x.id),expectedClients.slice(0,20).map(x=>x.id));
        values.set('crm.test-lab.v1',JSON.stringify({source:'live'}));
        assert.equal(canEditExclusiveOwners(),false);
        await assert.rejects(exclusiveOwnersApi.update(owner.id,{}),/not available/);
        console.log('Sample mutations passed');
    `;
        const output = execFileSync(
            process.execPath,
            ["--import", "tsx", "--input-type=module", "-e", script],
            {
                cwd: process.cwd(),
                encoding: "utf8",
                timeout: 25000,
                env: {
                    ...process.env,
                    NODE_ENV: "test",
                    NEXT_PUBLIC_USE_MOCK_DATA: "false",
                    NEXT_PUBLIC_FEATURE_PLATFORM_OWNER: "false",
                },
            },
        );
        assert.match(output, /Sample mutations passed/);
    },
);
