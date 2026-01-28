import { ToastContainer } from "react-toastify"
import AppRoutes from "./shared/routes/app.routes"

export function App() {
    return (
        <>
            <AppRoutes />
            <ToastContainer
                position="bottom-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="dark"
                toastClassName="auth-toast"
            />
        </>
    )
}

export default App