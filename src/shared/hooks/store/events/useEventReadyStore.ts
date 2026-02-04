import { create } from "zustand";
import { toastHelper } from "@/shared/helpers/toast.helper";
import type { EventReadyPayload } from "./events.types";
import { buildEventsUrl, getAuthHeaders, parseApiResponse } from "./events.api";
import { useHomeLanguageStore, type HomeLanguage } from "../home/home-language.store";

type EventReadyState = {
    data: Partial<Record<HomeLanguage, EventReadyPayload | null>>;
    getLoading: boolean;
    updateLoading: boolean;
    get: () => Promise<EventReadyPayload | null>;
    update: (payload: EventReadyPayload) => Promise<EventReadyPayload | null>;
};

export const useEventReadyStore = create<EventReadyState>((set) => ({
    data: {},
    getLoading: false,
    updateLoading: false,
    get: async () => {
        const { language } = useHomeLanguageStore.getState();
        set({ getLoading: true });
        try {
            const response = await fetch(buildEventsUrl("/api/v1/events/ready", language));
            const payload = await parseApiResponse<EventReadyPayload>(response, { showToast: false });
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
            const response = await fetch(buildEventsUrl("/api/v1/events/ready", language), {
                method: "PATCH",
                cache: "no-store",
                headers,
                body: JSON.stringify(payload),
            });
            const result = await parseApiResponse<EventReadyPayload>(response);
            set((state) => ({
                data: {
                    ...state.data,
                    [language]: result.data ?? null,
                },
            }));
            toastHelper(result.message || "Event ready updated successfully.", "success");
            return result.data ?? null;
        } finally {
            set({ updateLoading: false });
        }
    },
}));

