import { create } from "zustand";
import { toastHelper } from "@/shared/helpers/toast.helper";
import type { StudioHeroPayload } from "./studio.types";
import { buildStudioUrl, getAuthHeaders, parseApiResponse } from "./studio.api";
import { useHomeLanguageStore, type HomeLanguage } from "../home/home-language.store";

type StudioHeroState = {
    data: Partial<Record<HomeLanguage, StudioHeroPayload | null>>;
    getLoading: boolean;
    updateLoading: boolean;
    get: () => Promise<StudioHeroPayload | null>;
    update: (payload: StudioHeroPayload) => Promise<StudioHeroPayload | null>;
};

export const useStudioHeroStore = create<StudioHeroState>((set) => ({
    data: {},
    getLoading: false,
    updateLoading: false,
    get: async () => {
        const { language } = useHomeLanguageStore.getState();
        set({ getLoading: true });
        try {
            const response = await fetch(buildStudioUrl("/api/v1/studio/hero", language));
            if (response.status === 404) {
                set((state) => ({
                    data: {
                        ...state.data,
                        [language]: null,
                    },
                }));
                return null;
            }
            const payload = await parseApiResponse<StudioHeroPayload>(response, { showToast: false });
            set((state) => ({
                data: {
                    ...state.data,
                    [language]: payload.data ?? null,
                },
            }));
            return payload.data ?? null;
        } catch {
            set((state) => ({
                data: {
                    ...state.data,
                    [language]: null,
                },
            }));
            return null;
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
            const response = await fetch(buildStudioUrl("/api/v1/studio/hero", language), {
                method: "PATCH",
                cache: "no-store",
                headers,
                body: JSON.stringify(payload),
            });
            const result = await parseApiResponse<StudioHeroPayload>(response);
            set((state) => ({
                data: {
                    ...state.data,
                    [language]: result.data ?? null,
                },
            }));
            toastHelper(result.message || "Studio hero updated successfully.", "success");
            return result.data ?? null;
        } finally {
            set({ updateLoading: false });
        }
    },
}));

