import { cn } from "@/lib/utils";
import { Outlet } from "react-router-dom";

const ContactLayout = () => {
    return (
        <div>
            {/* content */}
            <div className={cn("p-4 mt-4", "bg-white/10 backdrop-blur-sm text-white shadow-inner shadow-white", "rounded-xl")}>
                <Outlet />
            </div>
        </div>
    )
}

export default ContactLayout;