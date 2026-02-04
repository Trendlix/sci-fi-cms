import { Toaster } from "sonner"
import AppRoutes from "./shared/routes/app.routes"

export function App() {
    return (
        <>
            <AppRoutes />
            <Toaster
                position="bottom-right"
                theme="dark"
                duration={3000}
            />
        </>
    )
}

export default App