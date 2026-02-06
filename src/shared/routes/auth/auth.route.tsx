import AccountPage from "@/pages/auth/account/page";
import Cookies from "js-cookie";
import { Route, Navigate } from "react-router-dom";
import { useMemo } from "react";
import { verifyToken } from "../../helpers/token.helper";
import { useAuth } from "../../hooks/store/useAuth";

const useAuthStatus = () => {
    const { token: authToken, accountStatus } = useAuth();
    const cookiesToken = Cookies.get("auth_token") ?? Cookies.get("sci_fi_auth_token");
    const token = useMemo(() => authToken ?? cookiesToken ?? null, [authToken, cookiesToken]);
    const isTokenValid = token ? verifyToken(token) : false;
    const cookieUserRaw = Cookies.get("sci_fi_auth_user") ?? Cookies.get("auth_user");
    const cookieStatus = useMemo(() => {
        if (!cookieUserRaw) {
            return null;
        }
        try {
            return JSON.parse(cookieUserRaw).status ?? null;
        } catch {
            return null;
        }
    }, [cookieUserRaw]);
    const resolvedStatus = accountStatus ?? cookieStatus;
    const isActive = resolvedStatus?.toLowerCase() === "active";
    return { isTokenValid, isActive };
};

const AuthAccountRoute = () => {
    const { isTokenValid, isActive } = useAuthStatus();
    if (isTokenValid && isActive) {
        return <Navigate to="/cms/home" replace />;
    }
    return <AccountPage />;
};

const AuthRoutes = () => {
    return (
        <Route path="/auth/account" element={<AuthAccountRoute />} />
    );
}

export default AuthRoutes;