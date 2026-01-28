import HomeLayout from "@/pages/cms/home/layout";
import AboutPage from "@/pages/cms/home/about/page";
import TestimonialsPage from "@/pages/cms/home/testimonials/page";
import LocationsPage from "@/pages/cms/home/locations/page";
import HorizontalSectionsPage from "@/pages/cms/home/horizontal-sections/page";
import { Route } from "react-router-dom";
import HeroPage from "@/pages/cms/home/page";

const HomeRoutes = () => {
    return (
        <Route path="home" element={<HomeLayout />}>
            <Route index element={<HeroPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="horizontal" element={<HorizontalSectionsPage />} />
            <Route path="testimonials" element={<TestimonialsPage />} />
            <Route path="locations" element={<LocationsPage />} />
        </Route>
    )
}

export default HomeRoutes;