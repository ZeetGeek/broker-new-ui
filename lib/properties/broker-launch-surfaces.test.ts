import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import assert from "node:assert/strict";
import { register } from "node:module";
import test from "node:test";

import {
    BROKER_CONTACTS_HREF,
    BROKER_YOUR_LISTINGS_HREF,
    brokerYourListingsHref,
} from "@/lib/routes/broker";

import { FEATURE_PLATFORM_OWNER } from "@/config";
import type { SavedProperty } from "@/features/properties/saved-properties/map-saved-property";
import { SAVED_PROPERTIES_QUERY_KEY } from "@/features/properties/saved-properties/saved-properties-query";
import { MOCK_MY_LISTINGS_SEED } from "@/features/properties/your-listings/mock-my-listings";

// These are semantic server-render checks, not layout checks. Node does not load
// the spinner's CSS the way Next does; ignore styles only in this test process.
register(
    `data:text/javascript,${encodeURIComponent(`
    export async function load(url, context, nextLoad) {
        if (url.endsWith('.css')) return { format: 'module', source: 'export default {};', shortCircuit: true };
        return nextLoad(url, context);
    }
`)}`,
);

const [
    { default: LegacyPropertiesRoute },
    { default: OwnersLayout },
    { default: YourListingsRoute },
    { SavedPropertiesEmpty },
    { SavedPropertiesGrid },
    { SavedPropertiesPage },
    { MyListingsRequestsPanel },
    { YourListingsPage },
    { YourListingsTabs },
] = await Promise.all([
    import("@/app/(role)/broker/my-properties/page"),
    import("@/app/(role)/broker/owners/layout"),
    import("@/app/(role)/broker/your-listings/page"),
    import("@/features/properties/saved-properties/saved-properties-empty"),
    import("@/features/properties/saved-properties/saved-properties-grid"),
    import("@/features/properties/saved-properties/saved-properties-page"),
    import("@/features/properties/your-listings/my-listings-requests-panel"),
    import("@/features/properties/your-listings/your-listings-page"),
    import("@/features/properties/your-listings-tabs"),
]);

const ownerBookmark: SavedProperty = {
    id: "qa-owner-bookmark",
    source: "owner-listing",
    listing: { id: "qa-owner-bookmark" } as Extract<
        SavedProperty,
        { source: "owner-listing" }
    >["listing"],
};
const ownBookmark: SavedProperty = {
    id: "qa-own-bookmark",
    source: "your-listing",
    // Image optimization is exercised by Next, not this semantic Node render.
    listing: {
        ...MOCK_MY_LISTINGS_SEED[0],
        id: "qa-own-bookmark",
        imageSrc: "",
        imageSrcs: [],
        photoCount: 0,
    },
};

function redirectedTo(path: string) {
    return (error: unknown) =>
        error instanceof Error && "digest" in error && String(error.digest).includes(`;${path};`);
}

test("request navigation follows the launch mode", () => {
    assert.equal(
        brokerYourListingsHref("requests"),
        FEATURE_PLATFORM_OWNER
            ? `${BROKER_YOUR_LISTINGS_HREF}?tab=requests`
            : BROKER_YOUR_LISTINGS_HREF,
    );
    const html = renderToStaticMarkup(
        createElement(YourListingsTabs, { activeTab: "representing" }),
    );
    assert.equal(html.includes("tab=requests"), FEATURE_PLATFORM_OWNER);
});

test(
    "disabled request routes and aliases redirect, and their panel cannot mount hooks",
    { skip: FEATURE_PLATFORM_OWNER },
    async () => {
        await assert.rejects(
            YourListingsRoute({ searchParams: Promise.resolve({ tab: "requests" }) }),
            redirectedTo(BROKER_YOUR_LISTINGS_HREF),
        );
        await assert.rejects(
            LegacyPropertiesRoute({ searchParams: Promise.resolve({ tab: "requests" }) }),
            redirectedTo(BROKER_YOUR_LISTINGS_HREF),
        );
        assert.equal(MyListingsRequestsPanel(), null);
        const page = YourListingsPage({ activeTab: "requests" });
        assert.notEqual(page.type, MyListingsRequestsPanel);
    },
);

test("platform owner profiles are gated without disabling the Contacts destination", () => {
    if (FEATURE_PLATFORM_OWNER) assert.equal(OwnersLayout({ children: "profile" }), "profile");
    else
        assert.throws(
            () => OwnersLayout({ children: "profile" }),
            redirectedTo(BROKER_CONTACTS_HREF),
        );
});

test(
    "broker-only saved grid isolates own cards from marketplace hooks",
    { skip: FEATURE_PLATFORM_OWNER },
    () => {
        // Calling the wrapper without providers would throw if it invoked the
        // marketplace's query/chat hooks. Inspect the card boundary before Next's
        // image/avatar components, which require Next's own module interop.
        let unsavedId: string | undefined;
        const grid = SavedPropertiesGrid({
            items: [ownerBookmark, ownBookmark],
            onUnsave: (id) => {
                unsavedId = id;
            },
        });
        assert.deepEqual(
            grid.props.items.map((item: SavedProperty) => item.id),
            [ownBookmark.id],
        );
        const card = grid.props.renderItem(grid.props.items[0], 0);
        const propertyCard = card.type(card.props);
        assert.equal(propertyCard.props.variant, "owned");
        assert.equal(propertyCard.props.detailsHref, "/broker/properties/qa-own-bookmark");
        assert.equal(propertyCard.props.onChat, undefined);
        assert.equal(propertyCard.props.onRequest, undefined);
        propertyCard.props.onToggleSave();
        assert.equal(unsavedId, ownBookmark.id);
        const empty = renderToStaticMarkup(createElement(SavedPropertiesEmpty));
        assert.ok(empty.includes('href="/broker/your-listings"'));
        assert.ok(!empty.includes('href="/broker/owner-listings"'));
    },
);

test(
    "an owner-only bookmark page keeps pagination available until the list is exhausted",
    { skip: FEATURE_PLATFORM_OWNER },
    () => {
        const client = new QueryClient();
        const firstPage = { items: [ownerBookmark], total: 2, nextCursor: "2" };
        client.setQueryData(SAVED_PROPERTIES_QUERY_KEY, { pages: [firstPage], pageParams: [null] });
        const renderPage = () =>
            renderToStaticMarkup(
                createElement(QueryClientProvider, { client }, createElement(SavedPropertiesPage)),
            );
        const initial = renderPage();
        assert.ok(initial.includes("Checking more saved properties"));
        assert.ok(initial.includes("More results load as you scroll"));
        assert.ok(!initial.includes("No saved properties yet"));
        assert.ok(!initial.includes("qa-owner-bookmark"));
        client.setQueryData(SAVED_PROPERTIES_QUERY_KEY, {
            pages: [firstPage, { items: [ownerBookmark], total: 2, nextCursor: null }],
            pageParams: [null, "2"],
        });
        const loaded = renderPage();
        assert.ok(loaded.includes("No saved properties yet"));
        assert.ok(!loaded.includes("qa-owner-bookmark"));
        assert.ok(!loaded.includes("Checking more saved properties"));
        client.clear();
    },
);
