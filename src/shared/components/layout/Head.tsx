import { cn } from "@/lib/utils";
import Cookies from "js-cookie";

const Head = () => {
    const userName = JSON.parse(Cookies.get("sci_fi_auth_user") ?? "{}").user_name;
    return (<header className={cn("flex items-center justify-between", "w-full bg-primary/10 backdrop-blur-sm", "p-4 rounded-b-2xl shadow-lg", "border-b border-white/10")}>
        {/* logo */}
        <img src="/brand/logo.png" alt="logo" width={100} height={100} />
        {/* user name */}
        <span className="text-white text-sm font-medium">Welcome, {userName ?? "Guest"}</span>
    </header>);
}

export default Head;