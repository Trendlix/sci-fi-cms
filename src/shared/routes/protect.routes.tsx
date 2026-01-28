import Cookies from "js-cookie";
import { useAuth } from "../hooks/store/useAuth";
import { Navigate, useLocation } from "react-router-dom";
import { verifyToken } from "../helpers/token.helper";
import type { PropsWithChildren } from "react";
import { useMemo } from "react";

const ProtectRoutes = ({ children }: PropsWithChildren) => {
    const { token: authToken } = useAuth();
    const cookiesToken = Cookies.get("auth_token") ?? Cookies.get("sci_fi_auth_token");
    const token = useMemo(() => authToken ?? cookiesToken ?? null, [authToken, cookiesToken]);
    const isTokenValid = token ? verifyToken(token) : false;
    const location = useLocation();

    if (!token || !isTokenValid) {
        if (token && !isTokenValid) {
            Cookies.remove("auth_token");
            Cookies.remove("auth_user");
            Cookies.remove("sci_fi_auth_token");
            Cookies.remove("sci_fi_auth_user");
            useAuth.setState({ token: null, userName: null, accountStatus: null });
        }
        return <Navigate to="/auth/account" replace />;
    }

    if (token && isTokenValid && location.pathname === "/auth/account") {
        return <Navigate to="/cms/home" replace />;
    }

    return <>{children}</>;
}

export default ProtectRoutes;