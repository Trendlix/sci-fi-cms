import CmsLayout from "@/pages/cms/layout";
import { Route } from "react-router-dom";
import HomeRoutes from "./home/home.routes";
import ContactRoutes from "./contact/contact.routes";
import AboutRoutes from "./about/about.routes";
import StudioRoutes from "./studio/studio.routes";
import LandRoutes from "./land/land.routes";

const CmsRoutes = () => {
    return (
        <Route path="/cms" element={<CmsLayout />}>
            {HomeRoutes()}
            {ContactRoutes()}
            {AboutRoutes()}
            {StudioRoutes()}
            {LandRoutes()}
        </Route>
    )
}

export default CmsRoutes;