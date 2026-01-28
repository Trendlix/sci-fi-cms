import { create } from "zustand";
import { toastHelper } from "@/shared/helpers/toast.helper";
import type { LandHeroPayload } from "./land.types";
import { buildLandUrl, getAuthHeaders, parseApiResponse } from "./land.api";
import { useHomeLanguageStore, type HomeLanguage } from "../home/home-language.store";

type LandHeroState = {
    data: Partial<Record<HomeLanguage, LandHeroPayload | null>>;
    getLoading: boolean;
    updateLoading: boolean;
    get: () => Promise<LandHeroPayload | null>;
    update: (payload: LandHeroPayload) => Promise<LandHeroPayload | null>;
};

export const useLandHeroStore = create<LandHeroState>((set) => ({
    data: {},
    getLoading: false,
    updateLoading: false,
    get: async () => {
        const { language } = useHomeLanguageStore.getState();
        set({ getLoading: true });
        try {
            const response = await fetch(buildLandUrl("/api/v1/land/hero", language));
            const payload = await parseApiResponse<LandHeroPayload>(response, { showToast: false });
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
            const response = await fetch(buildLandUrl("/api/v1/land/hero", language), {
                method: "PATCH",
                headers,
                body: JSON.stringify(payload),
            });
            const result = await parseApiResponse<LandHeroPayload>(response);
            set((state) => ({
                data: {
                    ...state.data,
                    [language]: result.data ?? null,
                },
            }));
            toastHelper(result.message || "Land hero updated successfully.", "success");
            return result.data ?? null;
        } finally {
            set({ updateLoading: false });
        }
    },
}));

