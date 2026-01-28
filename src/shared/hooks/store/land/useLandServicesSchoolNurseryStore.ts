import { create } from "zustand";
import { toastHelper } from "@/shared/helpers/toast.helper";
import type { LandSchoolNurseryPayload } from "./land.types";
import { buildLandUrl, getAuthHeaders, parseApiResponse } from "./land.api";
import { useHomeLanguageStore, type HomeLanguage } from "../home/home-language.store";

type LandServicesSchoolNurseryState = {
    data: Partial<Record<HomeLanguage, LandSchoolNurseryPayload | null>>;
    getLoading: boolean;
    updateLoading: boolean;
    get: () => Promise<LandSchoolNurseryPayload | null>;
    update: (payload: LandSchoolNurseryPayload) => Promise<LandSchoolNurseryPayload | null>;
};

export const useLandServicesSchoolNurseryStore = create<LandServicesSchoolNurseryState>((set) => ({
    data: {},
    getLoading: false,
    updateLoading: false,
    get: async () => {
        const { language } = useHomeLanguageStore.getState();
        set({ getLoading: true });
        try {
            const response = await fetch(buildLandUrl("/api/v1/land/services/school-nursery", language));
            const payload = await parseApiResponse<LandSchoolNurseryPayload>(response, { showToast: false });
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
            const response = await fetch(buildLandUrl("/api/v1/land/services/school-nursery", language), {
                method: "PATCH",
                headers,
                body: JSON.stringify(payload),
            });
            const result = await parseApiResponse<LandSchoolNurseryPayload>(response);
            set((state) => ({
                data: {
                    ...state.data,
                    [language]: result.data ?? null,
                },
            }));
            toastHelper(result.message || "Land school & nursery updated successfully.", "success");
            return result.data ?? null;
        } finally {
            set({ updateLoading: false });
        }
    },
}));

