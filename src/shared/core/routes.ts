import { CalendarIcon, HardDrive, HomeIcon, PhoneIcon, Clapperboard, type LucideIcon, MapPinned } from "lucide-react";

export interface IRoute {
    path: string,
    name: string,
    icon: LucideIcon,
}

const routes: IRoute[] = [
    {
        path: "/cms/home",
        name: "Home",
        icon: HomeIcon,
    },
    {
        path: "/cms/about",
        name: "About",
        icon: HardDrive,
    },
    {
        path: "/cms/studio",
        name: "Studio",
        icon: Clapperboard,
    },
    {
        path: "/cms/land",
        name: "Land",
        icon: MapPinned,
    },
    {
        path: "/cms/contact",
        name: "Contact",
        icon: PhoneIcon,
    },
    {
        path: "/cms/events",
        name: "Events",
        icon: CalendarIcon,
    }
]

export default routes;