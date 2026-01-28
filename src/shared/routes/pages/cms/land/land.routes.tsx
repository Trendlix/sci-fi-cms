import LandLayout from "@/pages/cms/land/layout";
import LandHero from "@/pages/cms/land/page";
import DiscoverFloors from "@/pages/cms/land/discover-floors/page";
import LandFloors from "@/pages/cms/land/floors/page";
import LandServicesRoutes from "./services.routes";
import { Route } from "react-router-dom";

const LandRoutes = () => {
    return (
        <Route path="land" element={<LandLayout />}>
            <Route index element={<LandHero />} />
            <Route path="discover-floors" element={<DiscoverFloors />} />
            <Route path="floors" element={<LandFloors />} />
            {LandServicesRoutes()}
        </Route>
    );
};

export default LandRoutes;

