import { cn } from "@/lib/utils";
import type { ITabItem } from "@/shared/core/tabs";
import { Link, useLocation } from "react-router-dom";

const Tabs = ({ tabs }: { tabs: ITabItem[] }) => {
    const currentPath = useLocation().pathname;
    const activeTabPath =
        tabs
            .filter((tab) => currentPath === tab.path || currentPath.startsWith(`${tab.path}/`))
            .sort((a, b) => b.path.length - a.path.length)[0]?.path ?? "";

    return (
        <div className="flex items-center gap-2">
            {tabs.map((tab) => (
                <TabItem key={tab.path} tab={tab} isActive={tab.path === activeTabPath} />
            ))}
        </div>
    );
}

const TabItem = ({ tab, isActive }: { tab: ITabItem; isActive: boolean }) => {
    const activeClass = isActive ? "bg-white/10 backdrop-blur-sm text-white shadow-inner shadow-white" : "bg-transparent text-white/50";
    return (<Link to={tab.path} className={cn("flex items-center gap-2 text-sm", "p-2 rounded-xl", activeClass)}>
        <tab.icon className={cn("w-4 h-4")} />
        <span>{tab.name}</span>
    </Link>);
}

export default Tabs;