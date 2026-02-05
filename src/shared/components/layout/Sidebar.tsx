import { cn } from "@/lib/utils";
import type { IRoute } from "@/shared/core/routes";
import routes from "@/shared/core/routes";
import { Link, useLocation } from "react-router-dom";

const Sidebar = () => {
    return (<aside>
        {routes.map((route) => (
            <SidebarItem key={route.path} route={route} />
        ))}
    </aside>);
}


const SidebarItem = ({ route }: { route: IRoute }) => {
    const location = useLocation();
    const activePath = route.path === "/cms/seo/home" ? "/cms/seo" : route.path;
    const isActive = location.pathname.startsWith(activePath);
    const activeClass = isActive ? "bg-white/10 backdrop-blur-sm text-white shadow-inner shadow-white" : "bg-transparent text-white/50";
    return (
        <Link to={isActive ? "#" : route.path} className={cn("flex items-center gap-2", "p-2 rounded-xl", activeClass)}>
            <route.icon className="w-4 h-4" />
            <span>{route.name}</span>
        </Link>
    );
}
export default Sidebar;