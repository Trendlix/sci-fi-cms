import { Info, Layers, MapPin, Rose, ScanEye, Star, TextSelect, type LucideIcon, Users, HelpCircle, MapPinned, TreePalm, Building2, Briefcase, Package, School, Footprints } from "lucide-react";

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
    {
        path: "/cms/about/pre-value",
        name: "Pre Value",
        icon: ScanEye,
    },
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