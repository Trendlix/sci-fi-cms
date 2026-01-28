import ContactLayout from "@/pages/cms/contact/layout";
import ContactPage from "@/pages/cms/contact/page";
import { Route } from "react-router-dom";

const ContactRoutes = () => {
    return (
        <Route path="contact" element={<ContactLayout />}>
            <Route index element={<ContactPage />} />
        </Route>
    )
}

export default ContactRoutes;