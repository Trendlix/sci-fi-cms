import AccountPage from "@/pages/auth/account/page";
import { Route } from "react-router-dom";
const AuthRoutes = () => {
    return (
        <Route path="/auth/account" element={<AccountPage />} />
    );
}

export default AuthRoutes;