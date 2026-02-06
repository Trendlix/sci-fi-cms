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
    const { accountStatus } = useAuth();
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

    if (!token || !isTokenValid || !isActive) {
        if (token && (!isTokenValid || !isActive)) {
            Cookies.remove("auth_token");
            Cookies.remove("auth_user");
            Cookies.remove("sci_fi_auth_token");
            Cookies.remove("sci_fi_auth_user");
            useAuth.setState({ token: null, userName: null, accountStatus: null });
        }
        return <Navigate to="/auth/account" replace />;
    }

    if (token && isTokenValid && isActive && location.pathname === "/auth/account") {
        return <Navigate to="/cms/home" replace />;
    }

    return <>{children}</>;
}

export default ProtectRoutes;