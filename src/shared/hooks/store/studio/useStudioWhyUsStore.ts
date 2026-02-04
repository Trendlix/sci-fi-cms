import { create } from "zustand";
import { toastHelper } from "@/shared/helpers/toast.helper";
import type { StudioWhyUsPayload } from "./studio.types";
import { buildStudioUrl, getAuthHeaders, parseApiResponse } from "./studio.api";
import { useHomeLanguageStore, type HomeLanguage } from "../home/home-language.store";

type StudioWhyUsState = {
    data: Partial<Record<HomeLanguage, StudioWhyUsPayload | null>>;
    getLoading: boolean;
    updateLoading: boolean;
    get: () => Promise<StudioWhyUsPayload | null>;
    update: (payload: StudioWhyUsPayload) => Promise<StudioWhyUsPayload | null>;
};

export const useStudioWhyUsStore = create<StudioWhyUsState>((set) => ({
    data: {},
    getLoading: false,
    updateLoading: false,
    get: async () => {
        const { language } = useHomeLanguageStore.getState();
        set({ getLoading: true });
        try {
            const response = await fetch(buildStudioUrl("/api/v1/studio/why-us", language));
            const payload = await parseApiResponse<StudioWhyUsPayload>(response, { showToast: false });
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
            const response = await fetch(buildStudioUrl("/api/v1/studio/why-us", language), {
                method: "PATCH",
                cache: "no-store",
                headers,
                body: JSON.stringify(payload),
            });
            const result = await parseApiResponse<StudioWhyUsPayload>(response);
            set((state) => ({
                data: {
                    ...state.data,
                    [language]: result.data ?? null,
                },
            }));
            toastHelper(result.message || "Studio why-us updated successfully.", "success");
            return result.data ?? null;
        } finally {
            set({ updateLoading: false });
        }
    },
}));

