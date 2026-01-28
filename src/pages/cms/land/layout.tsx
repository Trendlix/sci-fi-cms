import { cn } from "@/lib/utils";
import Tabs from "@/shared/components/layout/Tabs";
import { landTabs } from "@/shared/core/tabs";
import { Outlet } from "react-router-dom";

const LandLayout = () => {
    return (
        <div>
            <Tabs tabs={landTabs} />
            <div className={cn("p-4 mt-4", "bg-white/10 backdrop-blur-sm text-white shadow-inner shadow-white", "rounded-xl")}>
                <Outlet />
            </div>
        </div>
    );
};

export default LandLayout;

