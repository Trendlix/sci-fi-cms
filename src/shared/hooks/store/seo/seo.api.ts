import Cookies from "js-cookie";
import { toastHelper } from "@/shared/helpers/toast.helper";
import type { HomeLanguage } from "../home/home-language.store";

export type ApiResponse<T> = {
    ok: boolean;
    status: number;
    message: string;
    data?: T;
};

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").trim();
const DEV_BASE_URL = import.meta.env.DEV ? "http://localhost:3000" : "";

const buildBaseUrl = (path: string) => {
    const resolvedBaseUrl = API_BASE_URL || DEV_BASE_URL;
    if (!resolvedBaseUrl) {
        return path;
    }
    return `${resolvedBaseUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
};

export const buildSeoUrl = (path: string, lang: HomeLanguage) => {
    const base = buildBaseUrl(path);
    const separator = base.includes("?") ? "&" : "?";
    return `${base}${separator}lang=${lang}`;
};

export const getAuthHeaders = (): Record<string, string> => {
    const token = Cookies.get("sci_fi_auth_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
};

type ParseApiOptions = {
    showToast?: boolean;
};

export const parseApiResponse = async function parseApiResponse<T>(
    response: Response,
    options: ParseApiOptions = {}
) {
    const payload = (await response.json()) as ApiResponse<T>;
    if (!response.ok || !payload.ok) {
        const message = payload.message?.trim() || "Request failed.";
        if (options.showToast !== false) {
            toastHelper(message, "error");
        }
        throw new Error(message);
    }
    return payload;
};

