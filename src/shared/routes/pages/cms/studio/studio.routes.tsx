import StudioLayout from "@/pages/cms/studio/layout";
import StudioHero from "@/pages/cms/studio/page";
import StudioAbout from "@/pages/cms/studio/about/page";
import StudioPartners from "@/pages/cms/studio/partners/page";
import StudioWhyUs from "@/pages/cms/studio/why-us/page";
import { Route } from "react-router-dom";

const StudioRoutes = () => {
    return (
        <Route path="studio" element={<StudioLayout />}>
            <Route index element={<StudioHero />} />
            <Route path="about" element={<StudioAbout />} />
            <Route path="partners" element={<StudioPartners />} />
            <Route path="why-us" element={<StudioWhyUs />} />
        </Route>
    );
};

export default StudioRoutes;

