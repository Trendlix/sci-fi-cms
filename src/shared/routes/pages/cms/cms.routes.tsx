import CmsLayout from "@/pages/cms/layout";
import { Route } from "react-router-dom";
import HomeRoutes from "./home/home.routes";
import ContactRoutes from "./contact/contact.routes";
import AboutRoutes from "./about/about.routes";
import StudioRoutes from "./studio/studio.routes";
import LandRoutes from "./land/land.routes";
import EventsRoutes from "./events/events.routes";
import SeoRoutes from "./seo/seo.routes";

const CmsRoutes = () => {
    return (
        <Route path="/cms" element={<CmsLayout />}>
            {HomeRoutes()}
            {ContactRoutes()}
            {AboutRoutes()}
            {StudioRoutes()}
            {LandRoutes()}
            {EventsRoutes()}
            {SeoRoutes()}
        </Route>
    )
}

export default CmsRoutes;