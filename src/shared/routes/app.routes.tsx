import { BrowserRouter, Navigate, Outlet, Routes, Route } from "react-router-dom"
import AuthRoutes from "./auth/auth.route"
import CmsRoutes from "./pages/cms/cms.routes"
import ProtectRoutes from "./protect.routes"

const AppRoutes = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/"
                    element={
                        <ProtectRoutes>
                            <Navigate to="/cms/home" replace />
                        </ProtectRoutes>
                    }
                />
                {AuthRoutes()}
                <Route element={<ProtectRoutes><Outlet /></ProtectRoutes>}>
                    {CmsRoutes()}
                </Route>
                <Route path="*" element={<Navigate to="/auth/account" replace />} />
            </Routes>
        </BrowserRouter>
    )
}

export default AppRoutes;