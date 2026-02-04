import { Info, Layers, MapPin, Rose, Star, TextSelect, type LucideIcon, Users, HelpCircle, MapPinned, TreePalm, Building2, Briefcase, Package, School, Footprints, Search } from "lucide-react";

export interface ITabItem {
    path: string;
    name: string;
    icon: LucideIcon;
}

export const homeTabs: ITabItem[] = [
    {
        path: "/cms/home",
        name: "Hero",
        icon: TextSelect,
    },
    {
        path: "/cms/home/about",
        name: "About",
        icon: Info,
    },
    {
        path: "/cms/home/horizontal",
        name: "Horizontal",
        icon: Layers,
    },
    {
        path: "/cms/home/testimonials",
        name: "Testimonials",
        icon: Star,
    },
    {
        path: "/cms/home/locations",
        name: "Locations",
        icon: MapPin,
    }
]

export const aboutTabs: ITabItem[] = [
    {
        path: "/cms/about",
        name: "Hero",
        icon: TextSelect,
    },
    {
        path: "/cms/about/about",
        name: "About",
        icon: Info,
    },
    {
        path: "/cms/about/service",
        name: "Service",
        icon: Layers,
    },
    // {
    //     path: "/cms/about/pre-value",
    //     name: "Pre Value",
    //     icon: ScanEye,
    // },
    {
        path: "/cms/about/value",
        name: "Value",
        icon: Rose,
    }
]

export const studioTabs: ITabItem[] = [
    {
        path: "/cms/studio",
        name: "Hero",
        icon: TextSelect,
    },
    {
        path: "/cms/studio/about",
        name: "About",
        icon: Info,
    },
    {
        path: "/cms/studio/partners",
        name: "Partners",
        icon: Users,
    },
    {
        path: "/cms/studio/why-us",
        name: "Why Us",
        icon: HelpCircle,
    },
]

export const landTabs: ITabItem[] = [
    {
        path: "/cms/land",
        name: "Hero",
        icon: TextSelect,
    },
    {
        path: "/cms/land/discover-floors",
        name: "Discover Floors",
        icon: MapPinned,
    },
    {
        path: "/cms/land/floors",
        name: "Floors",
        icon: Building2,
    },
    {
        path: "/cms/land/services",
        name: "Services",
        icon: Briefcase,
    },
];

export const landServiceTabs: ITabItem[] = [
    {
        path: "/cms/land/services",
        name: "Birthday Party",
        icon: Package,
    },
    {
        path: "/cms/land/services/membership",
        name: "Membership",
        icon: TreePalm,
    },
    {
        path: "/cms/land/services/school-nursery",
        name: "School & Nursery",
        icon: School,
    },
    {
        path: "/cms/land/services/walkin",
        name: "Walkin",
        icon: Footprints,
    },
];

export const eventsTabs: ITabItem[] = [
    {
        path: "/cms/events",
        name: "Hero",
        icon: TextSelect,
    },
    {
        path: "/cms/events/about",
        name: "About",
        icon: Info,
    },
    // {
    //     path: "/cms/events/program",
    //     name: "Program",
    //     icon: Layers,
    // },
    // {
    //     path: "/cms/events/how",
    //     name: "How",
    //     icon: HelpCircle,
    // },
    // {
    //     path: "/cms/events/ready",
    //     name: "Ready",
    //     icon: Star,
    // },
    {
        path: "/cms/events/featured",
        name: "Featured",
        icon: Rose,
    },
    {
        path: "/cms/events/partners",
        name: "Partners",
        icon: Users,
    },
    // {
    //     path: "/cms/events/upcoming",
    //     name: "Upcoming",
    //     icon: MapPin,
    // },
];

export const seoTabs: ITabItem[] = [
    {
        path: "/cms/seo/home",
        name: "Home",
        icon: Search,
    },
    {
        path: "/cms/seo/about",
        name: "About",
        icon: Info,
    },
    {
        path: "/cms/seo/contact",
        name: "Contact",
        icon: MapPin,
    },
    {
        path: "/cms/seo/events",
        name: "Events",
        icon: Star,
    },
    {
        path: "/cms/seo/studio",
        name: "Studio",
        icon: Users,
    },
    {
        path: "/cms/seo/land",
        name: "Land",
        icon: MapPinned,
    },
];