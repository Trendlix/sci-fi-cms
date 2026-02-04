import EventsLayout from "@/pages/cms/events/layout";
import EventsHero from "@/pages/cms/events/page";
import EventsAbout from "@/pages/cms/events/about/page";
// import EventsProgram from "@/pages/cms/events/program/page";
// import EventsHow from "@/pages/cms/events/how/page";
// import EventsReady from "@/pages/cms/events/ready/page";
import EventsFeatured from "@/pages/cms/events/featured/page";
import EventsPartners from "@/pages/cms/events/partners/page";
// import EventsUpcoming from "@/pages/cms/events/upcoming/page";
import { Route } from "react-router-dom";

const EventsRoutes = () => {
    return (
        <Route path="events" element={<EventsLayout />}>
            <Route index element={<EventsHero />} />
            <Route path="about" element={<EventsAbout />} />
            {/* <Route path="program" element={<EventsProgram />} /> */}
            {/* <Route path="how" element={<EventsHow />} /> */}
            {/* <Route path="ready" element={<EventsReady />} /> */}
            <Route path="featured" element={<EventsFeatured />} />
            <Route path="partners" element={<EventsPartners />} />
            {/* <Route path="upcoming" element={<EventsUpcoming />} /> */}
        </Route>
    );
};

export default EventsRoutes;

