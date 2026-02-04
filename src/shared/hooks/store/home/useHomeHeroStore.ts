import { create } from "zustand";
import { toastHelper } from "@/shared/helpers/toast.helper";
import type { HeroPayload } from "./home.types";
import { buildHomeUrl, getAuthHeaders, parseApiResponse } from "./home.api";
import { useHomeLanguageStore, type HomeLanguage } from "./home-language.store";

type HeroState = {
    data: Partial<Record<HomeLanguage, HeroPayload | null>>;
    getLoading: boolean;
    updateLoading: boolean;
    get: () => Promise<HeroPayload | null>;
    update: (payload: HeroPayload) => Promise<HeroPayload | null>;
};

export const useHomeHeroStore = create<HeroState>((set) => ({
    data: {},
    getLoading: false,
    updateLoading: false,
    get: async () => {
        const { language } = useHomeLanguageStore.getState();
        set({ getLoading: true });
        try {
            const response = await fetch(buildHomeUrl("/api/v1/home/hero", language), {
                cache: "no-store",
            });
            const payload = await parseApiResponse<HeroPayload>(response, { showToast: false });
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
            const headers: HeadersInit = {
                "Content-Type": "application/json",
                ...getAuthHeaders(),
            };
            const response = await fetch(buildHomeUrl("/api/v1/home/hero", language), {
                method: "PATCH",
                headers,
                body: JSON.stringify(payload),
            });
            const result = await parseApiResponse<HeroPayload>(response);
            set((state) => ({
                data: {
                    ...state.data,
                    [language]: result.data ?? null,
                },
            }));
            toastHelper(result.message || "Hero updated successfully.", "success");
            return result.data ?? null;
        } finally {
            set({ updateLoading: false });
        }
    },
}));

