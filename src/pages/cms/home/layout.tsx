import { cn } from "@/lib/utils";
import Tabs from "@/shared/components/layout/Tabs";
import { homeTabs } from "@/shared/core/tabs";
import { Outlet } from "react-router-dom";

const HomeLayout = () => {
    return (
        <div>
            {/* tabs */}
            <Tabs tabs={homeTabs} />
            {/* content */}
            <div className={cn("p-4 mt-4", "bg-white/10 backdrop-blur-sm text-white shadow-inner shadow-white", "rounded-xl")}>
                <Outlet />
            </div>
        </div>
    )
}

export default HomeLayout;