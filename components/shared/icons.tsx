/**
 * Shared icon registry — Tabler only.
 *
 * Import icons from here, never from `lucide-react` or `@tabler/icons-react`
 * directly. If shadcn re-adds Lucide under `components/ui/`, remap to this
 * file.
 *
 * Product actions that must never drift:
 *   WhatsAppIcon · CallIcon · MailIcon
 *
 * Everything else is re-exported under the familiar short names used across
 * the app (Search, MapPin, Check, …) so call sites stay readable.
 *
 * To add an icon: import the Tabler `Icon*` above, then either export a
 * semantic name (preferred for product actions) or a short alias below.
 * Generated via: node scripts/generate-icons-module.mjs
 */

import type { IconProps, TablerIcon } from "@tabler/icons-react";

/** Icon component type — use instead of LucideIcon. */
export type AppIcon = TablerIcon;
export type { IconProps };

import {
    IconActivity,
    IconAddressBook,
    IconAdjustmentsHorizontal,
    IconAlertCircle,
    IconAlertTriangle,
    IconArmchair,
    IconArrowBackUp,
    IconArrowLeft,
    IconArrowRight,
    IconArrowsDownUp,
    IconArrowsLeftRight,
    IconArrowsMaximize,
    IconArrowsMove,
    IconArrowsVertical,
    IconAward,
    IconBan,
    IconBarbell,
    IconBath,
    IconBed,
    IconBedFlat,
    IconBell,
    IconBellRinging,
    IconBike,
    IconBolt,
    IconBook,
    IconBookmark,
    IconBooks,
    IconBrandWhatsapp,
    IconBriefcase,
    IconBuilding,
    IconBuildingBank,
    IconBuildingChurch,
    IconBuildingFactory,
    IconBuildingHospital,
    IconBuildingSkyscraper,
    IconBuildingStore,
    IconBuildingWarehouse,
    IconBus,
    IconCalendar,
    IconCalendarCheck,
    IconCalendarPlus,
    IconCalendarStats,
    IconCalendarTime,
    IconCalendarWeek,
    IconCamera,
    IconCar,
    IconCheck,
    IconChecks,
    IconChevronDown,
    IconChevronLeft,
    IconChevronRight,
    IconChevronUp,
    IconChevronsLeft,
    IconChevronsRight,
    IconCircle,
    IconCircleCheck,
    IconCircleOff,
    IconCircleX,
    IconClock,
    IconClockOff,
    IconCoins,
    IconCommand,
    IconCompass,
    IconCopy,
    IconCrop,
    IconCrosshair,
    IconCurrencyDollar,
    IconCurrencyRupee,
    IconDeviceDesktop,
    IconDeviceGamepad2,
    IconDoor,
    IconDoorEnter,
    IconDots,
    IconDownload,
    IconDroplet,
    IconExternalLink,
    IconEye,
    IconEyeOff,
    IconFence,
    IconFile,
    IconFileSpreadsheet,
    IconFileText,
    IconFlame,
    IconGasStation,
    IconGift,
    IconGripVertical,
    IconHash,
    IconHeartHandshake,
    IconHelpCircle,
    IconHistory,
    IconHome,
    IconHourglass,
    IconInbox,
    IconInfoCircle,
    IconKey,
    IconKeyboard,
    IconLayersIntersect,
    IconLayoutDashboard,
    IconLayoutGrid,
    IconLayoutNavbar,
    IconLayoutSidebarRight,
    IconLeaf,
    IconLifebuoy,
    IconLink,
    IconList,
    IconLock,
    IconLogout,
    IconMail,
    IconMailCheck,
    IconMailOpened,
    IconMap,
    IconMap2,
    IconMapPin,
    IconMapPinOff,
    IconMaximize,
    IconMessage,
    IconMessageCircle,
    IconMicrophone,
    IconMinus,
    IconMoodKid,
    IconMoodSmile,
    IconNavigation,
    IconNote,
    IconPackage,
    IconPackageExport,
    IconPaperclip,
    IconParking,
    IconPaw,
    IconPencil,
    IconPhone,
    IconPhoto,
    IconPhotoPlus,
    IconPhotoUp,
    IconPill,
    IconPin,
    IconPinnedOff,
    IconPlane,
    IconPlayerPause,
    IconPlayerPlay,
    IconPlus,
    IconPool,
    IconReceipt,
    IconRefresh,
    IconRepeat,
    IconRepeatOnce,
    IconRocket,
    IconRosetteDiscount,
    IconRosetteDiscountCheck,
    IconRotate2,
    IconRotateClockwise,
    IconRoute,
    IconRuler,
    IconScale,
    IconSchool,
    IconScissors,
    IconSearch,
    IconSelector,
    IconSend,
    IconServer,
    IconSettings,
    IconShare,
    IconShield,
    IconShieldCheck,
    IconShieldExclamation,
    IconShieldQuestion,
    IconShirt,
    IconShoppingBag,
    IconSofa,
    IconSparkles,
    IconSpeakerphone,
    IconSun,
    IconSunWind,
    IconTag,
    IconTags,
    IconThumbDown,
    IconToolsKitchen,
    IconToolsKitchen2,
    IconTrain,
    IconTrash,
    IconTrees,
    IconTrendingDown,
    IconTruck,
    IconTypography,
    IconUpload,
    IconUser,
    IconUserCheck,
    IconUserCircle,
    IconUserPlus,
    IconUserSearch,
    IconUserX,
    IconUsers,
    IconUsersGroup,
    IconVideo,
    IconView360,
    IconWalk,
    IconWallet,
    IconWind,
    IconWorld,
    IconX,
} from "@tabler/icons-react";

/**
 * Semantic product icons — prefer these for contact / channel actions so the
 * glyph stays identical everywhere (cards, menus, boards, visit rows).
 */
export const WhatsAppIcon = IconBrandWhatsapp;
export const CallIcon = IconPhone;
export const MailIcon = IconMail;

export const Activity = IconActivity;
export const AlertCircle = IconAlertCircle;
export const AlertTriangle = IconAlertTriangle;
export const Armchair = IconArmchair;
export const ArrowDownUp = IconArrowsDownUp;
export const ArrowLeft = IconArrowLeft;
export const ArrowRight = IconArrowRight;
export const ArrowRightLeft = IconArrowsLeftRight;
export const Award = IconAward;
export const Baby = IconMoodKid;
export const BadgeCheck = IconRosetteDiscountCheck;
export const BadgePercent = IconRosetteDiscount;
export const Ban = IconBan;
export const Bath = IconBath;
export const Bed = IconBed;
export const BedDouble = IconBedFlat;
export const Bell = IconBell;
export const BellRing = IconBellRinging;
export const Bike = IconBike;
export const Bookmark = IconBookmark;
export const BookOpen = IconBook;
export const Briefcase = IconBriefcase;
export const Building = IconBuilding;
export const Building2 = IconBuildingSkyscraper;
export const Bus = IconBus;
export const Calendar = IconCalendar;
export const CalendarCheck = IconCalendarCheck;
export const CalendarClock = IconCalendarTime;
export const CalendarDays = IconCalendarWeek;
export const CalendarIcon = IconCalendar;
export const CalendarPlus = IconCalendarPlus;
export const CalendarRange = IconCalendarStats;
export const Camera = IconCamera;
export const Car = IconCar;
export const Check = IconCheck;
export const CheckCheck = IconChecks;
export const CheckCircle2 = IconCircleCheck;
export const CheckIcon = IconCheck;
export const ChevronDown = IconChevronDown;
export const ChevronDownIcon = IconChevronDown;
export const ChevronLeft = IconChevronLeft;
export const ChevronLeftIcon = IconChevronLeft;
export const ChevronRight = IconChevronRight;
export const ChevronRightIcon = IconChevronRight;
export const ChevronsLeft = IconChevronsLeft;
export const ChevronsRight = IconChevronsRight;
export const ChevronsUpDownIcon = IconSelector;
export const ChevronUpIcon = IconChevronUp;
export const Church = IconBuildingChurch;
export const Circle = IconCircle;
export const CircleAlert = IconAlertCircle;
export const CircleCheck = IconCircleCheck;
export const CircleCheckBig = IconCircleCheck;
export const CircleDollarSign = IconCurrencyDollar;
export const CircleHelp = IconHelpCircle;
export const CircleSlash = IconCircleOff;
export const CircleX = IconCircleX;
export const Clock = IconClock;
export const Clock3 = IconClock;
export const CloudSun = IconSunWind;
export const Command = IconCommand;
export const Compass = IconCompass;
export const Contact = IconAddressBook;
export const Copy = IconCopy;
export const CropIcon = IconCrop;
export const Crosshair = IconCrosshair;
export const DoorClosed = IconDoor;
export const DoorOpen = IconDoorEnter;
export const Download = IconDownload;
export const Droplets = IconDroplet;
export const Dumbbell = IconBarbell;
export const Ellipsis = IconDots;
export const Expand = IconArrowsMaximize;
export const ExternalLink = IconExternalLink;
export const Eye = IconEye;
export const EyeOff = IconEyeOff;
export const Factory = IconBuildingFactory;
export const Fence = IconFence;
export const File = IconFile;
export const FileImage = IconPhoto;
export const FileSpreadsheet = IconFileSpreadsheet;
export const FileText = IconFileText;
export const Flame = IconFlame;
export const Fuel = IconGasStation;
export const Gamepad2 = IconDeviceGamepad2;
export const Gift = IconGift;
export const Globe2 = IconWorld;
export const GraduationCap = IconSchool;
export const GripVertical = IconGripVertical;
export const HandCoins = IconCoins;
export const Handshake = IconHeartHandshake;
export const Hash = IconHash;
export const HeartHandshake = IconHeartHandshake;
export const History = IconHistory;
export const Home = IconHome;
export const Hospital = IconBuildingHospital;
export const Hotel = IconBuilding;
export const Hourglass = IconHourglass;
export const ImageIcon = IconPhoto;
export const ImagePlus = IconPhotoPlus;
export const Images = IconPhoto;
export const ImageUp = IconPhotoUp;
export const Inbox = IconInbox;
export const IndianRupee = IconCurrencyRupee;
export const Info = IconInfoCircle;
export const Keyboard = IconKeyboard;
export const KeyRound = IconKey;
export const Landmark = IconBuildingBank;
export const LandPlot = IconMap2;
export const Layers = IconLayersIntersect;
export const LayoutDashboard = IconLayoutDashboard;
export const LayoutGrid = IconLayoutGrid;
export const LayoutPanelTop = IconLayoutNavbar;
export const Leaf = IconLeaf;
export const Library = IconBooks;
export const LifeBuoy = IconLifebuoy;
export const Link2 = IconLink;
export const List = IconList;
export const Lock = IconLock;
export const LockKeyhole = IconLock;
export const LogOut = IconLogout;
export const Mail = IconMail;
export const MailCheck = IconMailCheck;
export const MailOpen = IconMailOpened;
export const Map = IconMap;
export const MapPin = IconMapPin;
export const MapPinned = IconMapPin;
export const MapPinOff = IconMapPinOff;
export const Maximize2 = IconMaximize;
export const Megaphone = IconSpeakerphone;
export const MessageCircle = IconMessageCircle;
export const MessageSquare = IconMessage;
export const Mic = IconMicrophone;
export const Minus = IconMinus;
export const Monitor = IconDeviceDesktop;
export const MoreHorizontal = IconDots;
export const MoreHorizontalIcon = IconDots;
export const Move3d = IconArrowsMove;
export const MoveRight = IconArrowRight;
export const MoveVertical = IconArrowsVertical;
export const Navigation = IconNavigation;
export const Package = IconPackage;
export const PackageOpen = IconPackageExport;
export const PanelRight = IconLayoutSidebarRight;
export const Paperclip = IconPaperclip;
export const ParkingCircle = IconParking;
export const Pause = IconPlayerPause;
export const PawPrint = IconPaw;
export const Pencil = IconPencil;
export const PersonStanding = IconWalk;
export const Phone = IconPhone;
export const PhoneCall = IconPhone;
export const Pill = IconPill;
export const Pin = IconPin;
export const PinOff = IconPinnedOff;
export const Plane = IconPlane;
export const Play = IconPlayerPlay;
export const Plus = IconPlus;
export const Receipt = IconReceipt;
export const RefreshCw = IconRefresh;
export const Repeat = IconRepeat;
export const Repeat2 = IconRepeatOnce;
export const Rocket = IconRocket;
export const RotateCcw = IconRotate2;
export const RotateCw = IconRotateClockwise;
export const Route = IconRoute;
export const Ruler = IconRuler;
export const Scale = IconScale;
export const Scaling = IconArrowsMaximize;
export const School = IconSchool;
export const Scissors = IconScissors;
export const Search = IconSearch;
export const Send = IconSend;
export const Server = IconServer;
export const Settings = IconSettings;
export const Share2 = IconShare;
export const Shield = IconShield;
export const ShieldAlert = IconShieldExclamation;
export const ShieldCheck = IconShieldCheck;
export const ShieldQuestion = IconShieldQuestion;
export const Shirt = IconShirt;
export const ShoppingBag = IconShoppingBag;
export const SlidersHorizontal = IconAdjustmentsHorizontal;
export const Smile = IconMoodSmile;
export const Sofa = IconSofa;
export const Sparkles = IconSparkles;
export const SquareParking = IconParking;
export const StickyNote = IconNote;
export const Store = IconBuildingStore;
export const Sun = IconSun;
export const Tag = IconTag;
export const Tags = IconTags;
export const ThumbsDown = IconThumbDown;
export const TimerOff = IconClockOff;
export const Train = IconTrain;
export const TrainFront = IconTrain;
export const Trash2 = IconTrash;
export const Trees = IconTrees;
export const TrendingDown = IconTrendingDown;
export const TriangleAlert = IconAlertTriangle;
export const Truck = IconTruck;
export const Type = IconTypography;
export const Undo2 = IconArrowBackUp;
export const Upload = IconUpload;
export const User = IconUser;
export const UserPlus = IconUserPlus;
export const UserRound = IconUserCircle;
export const UserRoundCheck = IconUserCheck;
export const UserRoundPlus = IconUserPlus;
export const UserRoundSearch = IconUserSearch;
export const UserRoundX = IconUserX;
export const Users = IconUsers;
export const UsersRound = IconUsersGroup;
export const Utensils = IconToolsKitchen2;
export const UtensilsCrossed = IconToolsKitchen;
export const Video = IconVideo;
export const View = IconView360;
export const Wallet = IconWallet;
export const Warehouse = IconBuildingWarehouse;
export const Waves = IconPool;
export const Wind = IconWind;
export const X = IconX;
export const XCircle = IconCircleX;
export const XIcon = IconX;
export const Zap = IconBolt;
