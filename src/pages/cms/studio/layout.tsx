import { cn } from "@/lib/utils";
import Tabs from "@/shared/components/layout/Tabs";
import { studioTabs } from "@/shared/core/tabs";
import { Outlet } from "react-router-dom";

const StudioLayout = () => {
    return (
        <div>
            <Tabs tabs={studioTabs} />
            <div className={cn("p-4 mt-4", "bg-white/10 backdrop-blur-sm text-white shadow-inner shadow-white", "rounded-xl")}>
                <Outlet />
            </div>
        </div>
    );
};

export default StudioLayout;

