
import AboutAbout from "@/pages/cms/about/about/page";
import AboutLayout from "@/pages/cms/about/layout";
import AboutHero from "@/pages/cms/about/page";
import AboutPreValue from "@/pages/cms/about/pre-value/page";
import AboutService from "@/pages/cms/about/service/page";
import AboutValue from "@/pages/cms/about/value/page";
import { Route } from "react-router-dom";

const AboutRoutes = () => {
    return (
        <Route path="about" element={<AboutLayout />}>
            <Route index element={<AboutHero />} />
            <Route path="about" element={<AboutAbout />} />
            <Route path="service" element={<AboutService />} />
            <Route path="pre-value" element={<AboutPreValue />} />
            <Route path="value" element={<AboutValue />} />
        </Route>
    )
}

export default AboutRoutes;