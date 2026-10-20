/**
 * Generates components/shared/icons.tsx from the Lucide→Tabler map.
 * Run: node scripts/generate-icons-module.mjs
 */
import fs from "node:fs";
import path from "node:path";
import * as Tabler from "@tabler/icons-react";

/** Lucide export name → Tabler Icon* export. */
const MAP = {
    Activity: "IconActivity",
    AlertCircle: "IconAlertCircle",
    AlertTriangle: "IconAlertTriangle",
    Armchair: "IconArmchair",
    ArrowDownUp: "IconArrowsDownUp",
    ArrowLeft: "IconArrowLeft",
    ArrowRight: "IconArrowRight",
    ArrowRightLeft: "IconArrowsLeftRight",
    Award: "IconAward",
    Baby: "IconMoodKid",
    BadgeCheck: "IconRosetteDiscountCheck",
    BadgePercent: "IconRosetteDiscount",
    Ban: "IconBan",
    Bath: "IconBath",
    Bed: "IconBed",
    BedDouble: "IconBedFlat",
    Bell: "IconBell",
    BellRing: "IconBellRinging",
    Bike: "IconBike",
    BookOpen: "IconBook",
    Bookmark: "IconBookmark",
    Briefcase: "IconBriefcase",
    Building: "IconBuilding",
    Building2: "IconBuildingSkyscraper",
    Bus: "IconBus",
    Calendar: "IconCalendar",
    CalendarCheck: "IconCalendarCheck",
    CalendarClock: "IconCalendarTime",
    CalendarDays: "IconCalendarWeek",
    CalendarIcon: "IconCalendar",
    CalendarPlus: "IconCalendarPlus",
    CalendarRange: "IconCalendarStats",
    Camera: "IconCamera",
    Car: "IconCar",
    Check: "IconCheck",
    CheckCheck: "IconChecks",
    CheckCircle2: "IconCircleCheck",
    CheckIcon: "IconCheck",
    ChevronDown: "IconChevronDown",
    ChevronDownIcon: "IconChevronDown",
    ChevronLeft: "IconChevronLeft",
    ChevronLeftIcon: "IconChevronLeft",
    ChevronRight: "IconChevronRight",
    ChevronRightIcon: "IconChevronRight",
    ChevronUpIcon: "IconChevronUp",
    ChevronsLeft: "IconChevronsLeft",
    ChevronsRight: "IconChevronsRight",
    ChevronsUpDownIcon: "IconSelector",
    Church: "IconBuildingChurch",
    Circle: "IconCircle",
    CircleAlert: "IconAlertCircle",
    CircleCheck: "IconCircleCheck",
    CircleCheckBig: "IconCircleCheck",
    CircleDollarSign: "IconCurrencyDollar",
    CircleHelp: "IconHelpCircle",
    CircleSlash: "IconCircleOff",
    CircleX: "IconCircleX",
    Clock: "IconClock",
    Clock3: "IconClock",
    CloudSun: "IconSunWind",
    Command: "IconCommand",
    Compass: "IconCompass",
    Contact: "IconAddressBook",
    Copy: "IconCopy",
    CropIcon: "IconCrop",
    Crosshair: "IconCrosshair",
    DoorClosed: "IconDoor",
    DoorOpen: "IconDoorEnter",
    Download: "IconDownload",
    Droplets: "IconDroplet",
    Dumbbell: "IconBarbell",
    Ellipsis: "IconDots",
    Expand: "IconArrowsMaximize",
    ExternalLink: "IconExternalLink",
    Eye: "IconEye",
    EyeOff: "IconEyeOff",
    Factory: "IconBuildingFactory",
    Fence: "IconFence",
    File: "IconFile",
    FileImage: "IconPhoto",
    FileSpreadsheet: "IconFileSpreadsheet",
    FileText: "IconFileText",
    Flame: "IconFlame",
    Fuel: "IconGasStation",
    Gamepad2: "IconDeviceGamepad2",
    Gift: "IconGift",
    Globe2: "IconWorld",
    GraduationCap: "IconSchool",
    GripVertical: "IconGripVertical",
    HandCoins: "IconCoins",
    Handshake: "IconHeartHandshake",
    Hash: "IconHash",
    HeartHandshake: "IconHeartHandshake",
    History: "IconHistory",
    Home: "IconHome",
    Hospital: "IconBuildingHospital",
    Hotel: "IconBuilding",
    Hourglass: "IconHourglass",
    ImageIcon: "IconPhoto",
    ImagePlus: "IconPhotoPlus",
    ImageUp: "IconPhotoUp",
    Images: "IconPhoto",
    Inbox: "IconInbox",
    IndianRupee: "IconCurrencyRupee",
    Info: "IconInfoCircle",
    KeyRound: "IconKey",
    Keyboard: "IconKeyboard",
    LandPlot: "IconMap2",
    Landmark: "IconBuildingBank",
    Layers: "IconLayersIntersect",
    LayoutDashboard: "IconLayoutDashboard",
    LayoutGrid: "IconLayoutGrid",
    LayoutPanelTop: "IconLayoutNavbar",
    Leaf: "IconLeaf",
    Library: "IconBooks",
    LifeBuoy: "IconLifebuoy",
    Link2: "IconLink",
    List: "IconList",
    Lock: "IconLock",
    LockKeyhole: "IconLock",
    LogOut: "IconLogout",
    Mail: "IconMail",
    MailCheck: "IconMailCheck",
    MailOpen: "IconMailOpened",
    Map: "IconMap",
    MapPin: "IconMapPin",
    MapPinOff: "IconMapPinOff",
    MapPinned: "IconMapPin",
    Maximize2: "IconMaximize",
    Megaphone: "IconSpeakerphone",
    // Generic chat bubble — WhatsApp CTAs must use WhatsAppIcon
    MessageCircle: "IconMessageCircle",
    MessageSquare: "IconMessage",
    Mic: "IconMicrophone",
    Minus: "IconMinus",
    Monitor: "IconDeviceDesktop",
    MoreHorizontal: "IconDots",
    MoreHorizontalIcon: "IconDots",
    Move3d: "IconArrowsMove",
    MoveRight: "IconArrowRight",
    MoveVertical: "IconArrowsVertical",
    Navigation: "IconNavigation",
    Package: "IconPackage",
    PackageOpen: "IconPackageExport",
    PanelRight: "IconLayoutSidebarRight",
    Paperclip: "IconPaperclip",
    ParkingCircle: "IconParking",
    Pause: "IconPlayerPause",
    PawPrint: "IconPaw",
    Pencil: "IconPencil",
    PersonStanding: "IconWalk",
    Phone: "IconPhone",
    PhoneCall: "IconPhone",
    Pill: "IconPill",
    Pin: "IconPin",
    PinOff: "IconPinnedOff",
    Plane: "IconPlane",
    Play: "IconPlayerPlay",
    Plus: "IconPlus",
    Receipt: "IconReceipt",
    RefreshCw: "IconRefresh",
    Repeat: "IconRepeat",
    Repeat2: "IconRepeatOnce",
    Rocket: "IconRocket",
    RotateCcw: "IconRotate2",
    RotateCw: "IconRotateClockwise",
    Route: "IconRoute",
    Ruler: "IconRuler",
    Scale: "IconScale",
    Scaling: "IconArrowsMaximize",
    School: "IconSchool",
    Scissors: "IconScissors",
    Search: "IconSearch",
    Send: "IconSend",
    Server: "IconServer",
    Settings: "IconSettings",
    Share2: "IconShare",
    Shield: "IconShield",
    ShieldAlert: "IconShieldExclamation",
    ShieldCheck: "IconShieldCheck",
    ShieldQuestion: "IconShieldQuestion",
    Shirt: "IconShirt",
    ShoppingBag: "IconShoppingBag",
    SlidersHorizontal: "IconAdjustmentsHorizontal",
    Smile: "IconMoodSmile",
    Sofa: "IconSofa",
    Sparkles: "IconSparkles",
    SquareParking: "IconParking",
    StickyNote: "IconNote",
    Store: "IconBuildingStore",
    Sun: "IconSun",
    Tag: "IconTag",
    Tags: "IconTags",
    ThumbsDown: "IconThumbDown",
    TimerOff: "IconClockOff",
    Train: "IconTrain",
    TrainFront: "IconTrain",
    Trash2: "IconTrash",
    Trees: "IconTrees",
    TrendingDown: "IconTrendingDown",
    TriangleAlert: "IconAlertTriangle",
    Truck: "IconTruck",
    Type: "IconTypography",
    Undo2: "IconArrowBackUp",
    Upload: "IconUpload",
    User: "IconUser",
    UserPlus: "IconUserPlus",
    UserRound: "IconUserCircle",
    UserRoundCheck: "IconUserCheck",
    UserRoundPlus: "IconUserPlus",
    UserRoundSearch: "IconUserSearch",
    UserRoundX: "IconUserX",
    Users: "IconUsers",
    UsersRound: "IconUsersGroup",
    Utensils: "IconToolsKitchen2",
    UtensilsCrossed: "IconToolsKitchen",
    Video: "IconVideo",
    View: "IconView360",
    Wallet: "IconWallet",
    Warehouse: "IconBuildingWarehouse",
    Waves: "IconPool",
    Wind: "IconWind",
    X: "IconX",
    XCircle: "IconCircleX",
    XIcon: "IconX",
    Zap: "IconBolt",
};

const missing = [];
for (const [lucide, tabler] of Object.entries(MAP)) {
    if (!(tabler in Tabler)) missing.push(`${lucide} → ${tabler}`);
}
if (missing.length) {
    console.error("Missing Tabler exports:\n" + missing.join("\n"));
    process.exit(1);
}

const tablerNames = [...new Set(Object.values(MAP))].sort();
// Semantic product icons (always include even if also aliased)
const semantic = {
    WhatsAppIcon: "IconBrandWhatsapp",
    CallIcon: "IconPhone",
    MailIcon: "IconMail",
};
for (const tabler of Object.values(semantic)) {
    if (!(tabler in Tabler)) {
        console.error("Missing semantic Tabler export:", tabler);
        process.exit(1);
    }
    if (!tablerNames.includes(tabler)) tablerNames.push(tabler);
}
tablerNames.sort();

const importBlock = `import {\n${tablerNames.map((n) => `    ${n},`).join("\n")}\n} from "@tabler/icons-react";\n`;

const typeBlock = `import type { IconProps, TablerIcon } from "@tabler/icons-react";

/** Icon component type — use instead of LucideIcon. */
export type AppIcon = TablerIcon;
export type { IconProps };
`;

const semanticBlock = `/**
 * Semantic product icons — prefer these for contact / channel actions so the
 * glyph stays identical everywhere (cards, menus, boards, visit rows).
 */
export const WhatsAppIcon = IconBrandWhatsapp;
export const CallIcon = IconPhone;
export const MailIcon = IconMail;
`;

const reexports = Object.entries(MAP)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([lucide, tabler]) => `export const ${lucide} = ${tabler};`)
    .join("\n");

const header = `/**
 * Shared icon registry — Tabler only.
 *
 * Import icons from here, never from \`lucide-react\` or \`@tabler/icons-react\`
 * directly. If shadcn re-adds Lucide under \`components/ui/\`, remap to this
 * file.
 *
 * Product actions that must never drift:
 *   WhatsAppIcon · CallIcon · MailIcon
 *
 * Everything else is re-exported under the familiar short names used across
 * the app (Search, MapPin, Check, …) so call sites stay readable.
 *
 * To add an icon: import the Tabler \`Icon*\` above, then either export a
 * semantic name (preferred for product actions) or a short alias below.
 * Generated via: node scripts/generate-icons-module.mjs
 */

`;

const out = `${header}${typeBlock}\n${importBlock}\n${semanticBlock}\n${reexports}\n`;

const dest = path.join(process.cwd(), "components", "shared", "icons.tsx");
fs.writeFileSync(dest, out, "utf8");
console.log("Wrote", dest, "—", Object.keys(MAP).length, "aliases +", Object.keys(semantic).length, "semantic");
