import { cn } from "@/lib/utils";
import CommonBg from "@/shared/common/CommonBg";
import Head from "@/shared/components/layout/Head";
import Sidebar from "@/shared/components/layout/Sidebar";
import CmsPreviewModal from "@/shared/components/layout/CmsPreviewModal";
import CmsUploadOverlay from "@/shared/components/layout/CmsUploadOverlay";
import { Outlet } from "react-router-dom";

const CmsLayout = () => {
    return (
        <div>
            <CommonBg />
            <Head />
            <CmsPreviewModal />
            <CmsUploadOverlay />
            <div className={cn("px-4 py-12", "grid grid-cols-12 items-start *:p-4", "relative")}>
                <div className={cn("col-span-2", "shadow-xl", "bg-primary/10 backdrop-blur-sm", "rounded-2xl rounded-r-none", "translate-y-3.5", "h-fit", "border border-primary/20 border-r-0", "sticky top-3.5")}>
                    <Sidebar />
                </div>
                <div className={cn("col-span-10", "shadow-xl", "bg-primary/10 backdrop-blur-sm", "rounded-2xl", "min-h-[50vh]", "border border-primary/20 border-l-0")}>
                    <Outlet />
                </div>
            </div>
        </div>
    )
}

export default CmsLayout;