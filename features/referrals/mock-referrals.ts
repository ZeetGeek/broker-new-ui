import {
    type CreditEntry,
    LISTING_COST_CREDITS,
    REFERRAL_REWARD_CREDITS,
    type ReferralCode,
    type ReferralItem,
} from "@/features/referrals/types";

const HOUR_MS = 60 * 60_000;
const DAY_MS = 24 * HOUR_MS;

function daysAgo(days: number, hour = 11): string {
    const date = new Date(Date.now() - days * DAY_MS);
    date.setHours(hour, 0, 0, 0);
    return date.toISOString();
}

function hoursAgo(hours: number): string {
    return new Date(Date.now() - hours * HOUR_MS).toISOString();
}

function daysAhead(days: number): string {
    return new Date(Date.now() + days * DAY_MS).toISOString();
}

/**
 * Fixtures cover every state on both tracks, because each renders differently:
 * a fresh invite, one gone quiet past the nudge threshold, one stuck at email
 * confirmation, a broker whose request is sitting with an owner, a broker who
 * got accepted, an owner who listed, and a dead link. A fixture set that is
 * all happy path is how an empty-handed state ships unnoticed.
 *
 * Names and localities match the Surat fixtures used by pipeline and visits.
 */
export const MOCK_REFERRALS: ReferralItem[] = [
    {
        id: "rf_301",
        status: "sent",
        role: null,
        person: {
            id: "rp_301",
            name: "Kalpesh Chauhan",
            phoneDigits: "9825014477",
            city: "Surat",
            agencyName: "Chauhan Estates",
        },
        channel: "whatsapp",
        invitedAt: hoursAgo(20),
        openedAt: null,
        joinedAt: null,
        verifiedAt: null,
        qualifiedAt: null,
        expiresAt: daysAhead(29),
        creditsEarned: 0,
        reminderCount: 0,
        lastRemindedAt: null,
        history: [
            {
                id: "re_3011",
                at: hoursAgo(20),
                label: "You sent the invite on WhatsApp",
                kind: "sent",
            },
        ],
    },
    {
        id: "rf_302",
        status: "opened",
        role: null,
        person: {
            id: "rp_302",
            name: "Nishit Vora",
            phoneDigits: "9727038812",
            city: "Surat",
        },
        channel: "whatsapp",
        // Past the stale threshold with no nudge yet — this is the row the
        // "Gone quiet" flag is built for.
        invitedAt: daysAgo(8),
        openedAt: daysAgo(7),
        joinedAt: null,
        verifiedAt: null,
        qualifiedAt: null,
        expiresAt: daysAhead(22),
        creditsEarned: 0,
        reminderCount: 0,
        lastRemindedAt: null,
        history: [
            {
                id: "re_3021",
                at: daysAgo(8),
                label: "You sent the invite on WhatsApp",
                kind: "sent",
            },
            { id: "re_3022", at: daysAgo(7), label: "Nishit opened the link", kind: "opened" },
        ],
    },
    {
        id: "rf_303",
        status: "joined",
        role: "broker",
        person: {
            id: "rp_303",
            name: "Bhavika Shah",
            phoneDigits: "9558872301",
            email: "bhavika.shah@gmail.com",
            city: "Surat",
            agencyName: "Shah Realty",
            avatarUrl: "/avatars/2.jpg",
        },
        channel: "sms",
        invitedAt: daysAgo(12),
        openedAt: daysAgo(11),
        joinedAt: daysAgo(10),
        // Signed up but never confirmed the email — nothing counts yet.
        verifiedAt: null,
        qualifiedAt: null,
        expiresAt: daysAhead(18),
        creditsEarned: 0,
        // Nudged once, recently — the button is inside its cooldown.
        reminderCount: 1,
        lastRemindedAt: hoursAgo(6),
        history: [
            { id: "re_3031", at: daysAgo(12), label: "You sent the invite by SMS", kind: "sent" },
            { id: "re_3032", at: daysAgo(11), label: "Bhavika opened the link", kind: "opened" },
            {
                id: "re_3033",
                at: daysAgo(10),
                label: "Bhavika created an account as a broker",
                kind: "joined",
            },
            { id: "re_3034", at: hoursAgo(6), label: "You nudged Bhavika", kind: "reminded" },
        ],
    },
    {
        id: "rf_307",
        status: "awaiting_approval",
        role: "broker",
        person: {
            id: "rp_307",
            name: "Devang Mistry",
            phoneDigits: "9714452038",
            email: "devang.mistry@gmail.com",
            city: "Surat",
        },
        channel: "whatsapp",
        invitedAt: daysAgo(9),
        openedAt: daysAgo(9),
        joinedAt: daysAgo(8),
        verifiedAt: daysAgo(8),
        // Request is with an owner. Credits are real but not earned yet.
        qualifiedAt: null,
        expiresAt: daysAhead(21),
        creditsEarned: 0,
        reminderCount: 0,
        lastRemindedAt: null,
        history: [
            {
                id: "re_3071",
                at: daysAgo(9),
                label: "You sent the invite on WhatsApp",
                kind: "sent",
            },
            { id: "re_3072", at: daysAgo(9), label: "Devang opened the link", kind: "opened" },
            {
                id: "re_3073",
                at: daysAgo(8),
                label: "Devang created an account as a broker",
                kind: "joined",
            },
            {
                id: "re_3074",
                at: daysAgo(8),
                label: "Devang confirmed his email",
                kind: "verified",
            },
            {
                id: "re_3075",
                at: daysAgo(3),
                label: "Devang asked an owner in Adajan to represent a property",
                kind: "awaiting_approval",
            },
        ],
    },
    {
        id: "rf_304",
        status: "qualified",
        role: "broker",
        person: {
            id: "rp_304",
            name: "Rakesh Patel",
            phoneDigits: "9879012345",
            email: "rakesh.patel@gmail.com",
            city: "Surat",
            agencyName: "Patel Property Hub",
            avatarUrl: "/avatars/1.jpg",
        },
        channel: "whatsapp",
        invitedAt: daysAgo(34),
        openedAt: daysAgo(34),
        joinedAt: daysAgo(33),
        verifiedAt: daysAgo(33),
        qualifiedAt: daysAgo(29),
        expiresAt: daysAgo(4),
        creditsEarned: REFERRAL_REWARD_CREDITS.broker,
        reminderCount: 0,
        lastRemindedAt: null,
        history: [
            {
                id: "re_3041",
                at: daysAgo(34),
                label: "You sent the invite on WhatsApp",
                kind: "sent",
            },
            { id: "re_3042", at: daysAgo(34), label: "Rakesh opened the link", kind: "opened" },
            {
                id: "re_3043",
                at: daysAgo(33),
                label: "Rakesh created an account as a broker",
                kind: "joined",
            },
            {
                id: "re_3044",
                at: daysAgo(33),
                label: "Rakesh confirmed his email",
                kind: "verified",
            },
            {
                id: "re_3045",
                at: daysAgo(31),
                label: "Rakesh asked an owner in Vesu to represent a property",
                kind: "awaiting_approval",
            },
            {
                id: "re_3046",
                at: daysAgo(29),
                label: "The owner accepted. You earned 100 credits",
                kind: "qualified",
            },
        ],
    },
    {
        id: "rf_308",
        status: "qualified",
        role: "owner",
        person: {
            id: "rp_308",
            name: "Hetal Desai",
            phoneDigits: "9909188342",
            email: "hetal.desai@gmail.com",
            city: "Surat",
            avatarUrl: "/avatars/4.jpg",
        },
        channel: "whatsapp",
        invitedAt: daysAgo(26),
        openedAt: daysAgo(26),
        joinedAt: daysAgo(25),
        verifiedAt: daysAgo(25),
        qualifiedAt: daysAgo(24),
        expiresAt: daysAgo(0),
        creditsEarned: REFERRAL_REWARD_CREDITS.owner,
        reminderCount: 0,
        lastRemindedAt: null,
        history: [
            {
                id: "re_3081",
                at: daysAgo(26),
                label: "You sent the invite on WhatsApp",
                kind: "sent",
            },
            { id: "re_3082", at: daysAgo(26), label: "Hetal opened the link", kind: "opened" },
            {
                id: "re_3083",
                at: daysAgo(25),
                label: "Hetal created an account as an owner",
                kind: "joined",
            },
            {
                id: "re_3084",
                at: daysAgo(25),
                label: "Hetal confirmed her email",
                kind: "verified",
            },
            {
                id: "re_3085",
                at: daysAgo(24),
                label: "Hetal listed her first property in Piplod. You earned 80 credits",
                kind: "qualified",
            },
        ],
    },
    {
        id: "rf_306",
        status: "expired",
        role: null,
        person: {
            id: "rp_306",
            name: "Mehul Desai",
            phoneDigits: "9426617790",
            city: "Navsari",
        },
        channel: "sms",
        invitedAt: daysAgo(48),
        openedAt: null,
        joinedAt: null,
        verifiedAt: null,
        qualifiedAt: null,
        expiresAt: daysAgo(18),
        creditsEarned: 0,
        // Nudged to the ceiling and still nothing — the button is spent.
        reminderCount: 3,
        lastRemindedAt: daysAgo(25),
        history: [
            { id: "re_3061", at: daysAgo(48), label: "You sent the invite by SMS", kind: "sent" },
            { id: "re_3062", at: daysAgo(40), label: "You nudged Mehul", kind: "reminded" },
            { id: "re_3063", at: daysAgo(32), label: "You nudged Mehul", kind: "reminded" },
            { id: "re_3064", at: daysAgo(25), label: "You nudged Mehul", kind: "reminded" },
            { id: "re_3065", at: daysAgo(18), label: "The invite link expired", kind: "expired" },
        ],
    },
];

/**
 * The ledger, newest first. Every earn line points back at the invite that
 * caused it so the row and the balance can never tell different stories.
 *
 * Spend lines are here too — a statement that only shows credits coming in is
 * not a statement, and the balance would not add up without them.
 */
export const MOCK_CREDIT_LEDGER: CreditEntry[] = [
    {
        id: "cl_407",
        kind: "listing_published",
        amount: -LISTING_COST_CREDITS,
        label: "Published a listing in Vesu",
        at: daysAgo(2),
        referralId: null,
    },
    {
        id: "cl_406",
        kind: "listing_published",
        amount: -LISTING_COST_CREDITS,
        label: "Published a listing in Pal",
        at: daysAgo(11),
        referralId: null,
    },
    {
        id: "cl_405",
        kind: "referral_qualified",
        amount: REFERRAL_REWARD_CREDITS.owner,
        label: "Hetal Desai qualified with your code",
        at: daysAgo(24),
        referralId: "rf_308",
    },
    {
        id: "cl_403",
        kind: "referral_qualified",
        amount: REFERRAL_REWARD_CREDITS.broker,
        label: "Rakesh Patel qualified with your code",
        at: daysAgo(29),
        referralId: "rf_304",
    },
    {
        id: "cl_402",
        kind: "bonus",
        amount: 50,
        label: "Founding broker bonus",
        at: daysAgo(60),
        referralId: null,
    },
];

/**
 * The broker's own code. Server-owned in production — the client cannot
 * derive it, so nothing here tries to.
 */
export const MOCK_REFERRAL_CODE: ReferralCode = {
    code: "YB-RAJESH",
    shareUrl: "https://yesbroker.in/join/YB-RAJESH",
};
