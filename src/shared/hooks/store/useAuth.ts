import { create } from "zustand";
import { toastHelper } from "@/shared/helpers/toast.helper";
import Cookies from "js-cookie";

type AuthStatus = "idle" | "loading" | "success" | "error";

type AccountPayload = {
    user_name?: string;
    email?: string;
    password: string;
};

type AccountResponse = {
    ok: boolean;
    status: number;
    message: string;
    data?: {
        user_name: string;
        status: string;
        token?: string;
    };
};

type AuthState = {
    status: AuthStatus;
    error: string | null;
    token: string | null;
    userName: string | null;
    accountStatus: string | null;
    account: (payload: AccountPayload) => Promise<AccountResponse>;
    reset: () => void;
};

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").trim();
const DEV_BASE_URL = import.meta.env.DEV ? "http://localhost:3000" : "";

const buildUrl = (path: string) => {
    const resolvedBaseUrl = API_BASE_URL || DEV_BASE_URL;
    if (!resolvedBaseUrl) {
        return path;
    }
    return `${resolvedBaseUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
};

const resolveMessage = (payload: Partial<AccountResponse> | null, fallback: string) => {
    const message = payload?.message?.trim();
    return message && message.length > 0 ? message : fallback;
};

const setAuthCookies = (payload: AccountResponse) => {
    const token = payload.data?.token;
    const userName = payload.data?.user_name;
    const status = payload.data?.status;
    if (!token || !userName || !status) {
        return;
    }
    const secure = typeof window !== "undefined" && window.location.protocol === "https:";
    const options = { sameSite: "lax" as const, secure, expires: 7, path: "/" };
    Cookies.set("sci_fi_auth_token", token, options);
    Cookies.set("sci_fi_auth_user", JSON.stringify({ user_name: userName, status }), options);
};

export const useAuth = create<AuthState>((set) => ({
    status: "idle",
    error: null,
    token: null,
    userName: null,
    accountStatus: null,
    account: async ({ user_name, email, password }) => {
        const resolvedUserName = user_name ?? email;
        if (!resolvedUserName) {
            const message = "Username or email is required.";
            set({ status: "error", error: message });
            toastHelper(message, "error");
            return Promise.reject(new Error(message));
        }

        set({ status: "loading", error: null });
        const response = await fetch(buildUrl("/api/v1/admin/account"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_name: resolvedUserName, password }),
        });

        const payload = (await response.json()) as AccountResponse;

        if (!response.ok || !payload.ok) {
            const message = resolveMessage(payload, "Failed to process account request.");
            set({ status: "error", error: message });
            toastHelper(message, "error");
            throw new Error(message);
        }

        set({
            status: "success",
            error: null,
            token: payload.data?.token ?? null,
            userName: payload.data?.user_name ?? null,
            accountStatus: payload.data?.status ?? null,
        });
        setAuthCookies(payload);
        toastHelper(resolveMessage(payload, "Account processed successfully."), "success");

        return payload;
    },
    reset: () =>
        set({
            status: "idle",
            error: null,
            token: null,
            userName: null,
            accountStatus: null,
        }),
}));
