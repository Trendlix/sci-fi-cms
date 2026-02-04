import SeoLayout from "@/pages/cms/seo/layout";
import SeoHomePage from "@/pages/cms/seo/home/page";
import SeoAboutPage from "@/pages/cms/seo/about/page";
import SeoContactPage from "@/pages/cms/seo/contact/page";
import SeoEventsPage from "@/pages/cms/seo/events/page";
import SeoStudioPage from "@/pages/cms/seo/studio/page";
import SeoLandPage from "@/pages/cms/seo/land/page";
import { Route } from "react-router-dom";

const SeoRoutes = () => {
    return (
        <Route path="seo" element={<SeoLayout />}>
            <Route index element={<SeoHomePage />} />
            <Route path="home" element={<SeoHomePage />} />
            <Route path="about" element={<SeoAboutPage />} />
            <Route path="contact" element={<SeoContactPage />} />
            <Route path="events" element={<SeoEventsPage />} />
            <Route path="studio" element={<SeoStudioPage />} />
            <Route path="land" element={<SeoLandPage />} />
        </Route>
    );
};

export default SeoRoutes;

