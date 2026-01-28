import LandServicesLayout from "@/pages/cms/land/services/layout";
import LandBirthdayService from "@/pages/cms/land/services/page";
import LandMembershipService from "@/pages/cms/land/services/membership/page";
import LandSchoolNurseryService from "@/pages/cms/land/services/school-nursery/page";
import LandWalkinService from "@/pages/cms/land/services/walkin/page";
import { Route } from "react-router-dom";

const LandServicesRoutes = () => {
    return (
        <Route path="services" element={<LandServicesLayout />}>
            <Route index element={<LandBirthdayService />} />
            <Route path="birthday" element={<LandBirthdayService />} />
            <Route path="membership" element={<LandMembershipService />} />
            <Route path="school-nursery" element={<LandSchoolNurseryService />} />
            <Route path="walkin" element={<LandWalkinService />} />
        </Route>
    );
};

export default LandServicesRoutes;

