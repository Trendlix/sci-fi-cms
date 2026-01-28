import { createElement } from "react";
import { toast, type ToastIcon } from "react-toastify";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";

export const toastHelper = (message: string, type: "success" | "error" | "warning" | "info") => {
    const icon: ToastIcon = () => (
        type === "success" ? createElement(CheckCircle2, { size: 18 }) :
            type === "error" ? createElement(AlertCircle, { size: 18 }) :
                type === "warning" ? createElement(TriangleAlert, { size: 18 }) :
                    createElement(Info, { size: 18 })
    );

    toast[type](message, {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        icon,
    });
}