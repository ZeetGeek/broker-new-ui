/**
 * WhatsApp CTAs used MessageCircle — point them at WhatsAppIcon.
 * Leaves lib/notifications/classify.ts on MessageCircle (generic chat).
 */
import fs from "node:fs";

const files = [
    "components/shared/property-card.tsx",
    "features/site-visits/broker/panels/visit-detail-panel.tsx",
    "features/site-visits/broker/my-visits/visit-timeline-row.tsx",
    "features/properties/owner-listings/owner-listing-detail-page.tsx",
    "features/owner-leads/owner-lead-card.tsx",
    "features/dashboard/you-represent-card.tsx",
    "features/dashboard/follow-ups-card.tsx",
];

for (const file of files) {
    let text = fs.readFileSync(file, "utf8");
    const next = text
        .replace(/\bMessageCircle\b/g, "WhatsAppIcon")
        // avoid double-prefix if re-run
        .replace(/\bWhatsAppIconIcon\b/g, "WhatsAppIcon");
    if (next !== text) {
        fs.writeFileSync(file, next, "utf8");
        console.log("updated", file);
    }
}
