import { create } from "zustand";
import { toastHelper } from "@/shared/helpers/toast.helper";
import type { LocationPayload } from "./home.types";
import { buildHomeUrl, getAuthHeaders, parseApiResponse } from "./home.api";
import { useHomeLanguageStore, type HomeLanguage } from "./home-language.store";

type LocationsState = {
    data: Partial<Record<HomeLanguage, LocationPayload[] | null>>;
    getLoading: boolean;
    updateLoading: boolean;
    get: () => Promise<LocationPayload[] | null>;
    update: (payload: LocationPayload[]) => Promise<LocationPayload[] | null>;
};

export const useHomeLocationsStore = create<LocationsState>((set) => ({
    data: {},
    getLoading: false,
    updateLoading: false,
    get: async () => {
        const { language } = useHomeLanguageStore.getState();
        set({ getLoading: true });
        try {
            const response = await fetch(buildHomeUrl("/api/v1/home/locations", language), {
                cache: "no-store",
                headers: getAuthHeaders(),
            });
            const payload = await parseApiResponse<LocationPayload[]>(response, { showToast: false });
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
            const response = await fetch(buildHomeUrl("/api/v1/home/locations", language), {
                method: "PATCH",
                cache: "no-store",
                headers: {
                    "Content-Type": "application/json",
                    ...getAuthHeaders(),
                },
                body: JSON.stringify(payload),
            });
            const result = await parseApiResponse<LocationPayload[]>(response);
            set((state) => ({
                data: {
                    ...state.data,
                    [language]: result.data ?? null,
                },
            }));
            toastHelper(result.message || "Locations updated successfully.", "success");
            return result.data ?? null;
        } finally {
            set({ updateLoading: false });
        }
    },
}));

