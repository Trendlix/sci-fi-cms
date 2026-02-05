import { create } from "zustand";
import { toastHelper } from "@/shared/helpers/toast.helper";
import type { AboutPayload } from "./home.types";
import { buildHomeUrl, getAuthHeaders, parseApiResponse } from "./home.api";
import { useHomeLanguageStore, type HomeLanguage } from "./home-language.store";

type AboutState = {
    data: Partial<Record<HomeLanguage, AboutPayload | null>>;
    getLoading: boolean;
    updateLoading: boolean;
    get: () => Promise<AboutPayload | null>;
    update: (payload: AboutPayload) => Promise<AboutPayload | null>;
};

export const useHomeAboutStore = create<AboutState>((set) => ({
    data: {},
    getLoading: false,
    updateLoading: false,
    get: async () => {
        const { language } = useHomeLanguageStore.getState();
        set({ getLoading: true });
        try {
            const response = await fetch(buildHomeUrl("/api/v1/home/about", language), {
                cache: "no-store",
                headers: getAuthHeaders(),
            });
            const payload = await parseApiResponse<AboutPayload>(response, { showToast: false });
            set((state) => ({
                data: {
                    ...state.data,
                    [language]: payload.data ?? null,
                },
            }));
            return payload.data ?? null;
        } finally {
            set({ getLoading: false });
        }
    },
    update: async (payload) => {
        const { language } = useHomeLanguageStore.getState();
        set({ updateLoading: true });
        try {
            const response = await fetch(buildHomeUrl("/api/v1/home/about", language), {
                method: "PATCH",
                cache: "no-store",
                headers: {
                    "Content-Type": "application/json",
                    ...getAuthHeaders(),
                },
                body: JSON.stringify(payload),
            });
            const result = await parseApiResponse<AboutPayload>(response);
            set((state) => ({
                data: {
                    ...state.data,
                    [language]: result.data ?? null,
                },
            }));
            toastHelper(result.message || "About updated successfully.", "success");
            return result.data ?? null;
        } finally {
            set({ updateLoading: false });
        }
    },
}));

