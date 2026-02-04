import { create } from "zustand";
import { toastHelper } from "@/shared/helpers/toast.helper";
import type { LocationPayload } from "./home.types";
import { buildHomeUrl, getAuthHeaders, parseApiResponse } from "./home.api";
import { useHomeLanguageStore } from "./home-language.store";

type LocationsState = {
    data: LocationPayload[] | null;
    getLoading: boolean;
    updateLoading: boolean;
    get: () => Promise<LocationPayload[] | null>;
    update: (payload: LocationPayload[]) => Promise<LocationPayload[] | null>;
};

export const useHomeLocationsStore = create<LocationsState>((set) => ({
    data: null,
    getLoading: false,
    updateLoading: false,
    get: async () => {
        const { language } = useHomeLanguageStore.getState();
        set({ getLoading: true });
        try {
            const response = await fetch(buildHomeUrl("/api/v1/home/locations", language), {
                cache: "no-store",
            });
            const payload = await parseApiResponse<LocationPayload[]>(response, { showToast: false });
            set({ data: payload.data ?? null });
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
            set({ data: result.data ?? null });
            toastHelper(result.message || "Locations updated successfully.", "success");
            return result.data ?? null;
        } finally {
            set({ updateLoading: false });
        }
    },
}));

