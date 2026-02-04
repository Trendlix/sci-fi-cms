import { create } from "zustand";
import { toastHelper } from "@/shared/helpers/toast.helper";
import type { EventProgramPayload } from "./events.types";
import { buildEventsUrl, getAuthHeaders, parseApiResponse } from "./events.api";
import { useHomeLanguageStore, type HomeLanguage } from "../home/home-language.store";

type EventProgramState = {
    data: Partial<Record<HomeLanguage, EventProgramPayload | null>>;
    getLoading: boolean;
    updateLoading: boolean;
    get: () => Promise<EventProgramPayload | null>;
    update: (payload: EventProgramPayload) => Promise<EventProgramPayload | null>;
};

export const useEventProgramStore = create<EventProgramState>((set) => ({
    data: {},
    getLoading: false,
    updateLoading: false,
    get: async () => {
        const { language } = useHomeLanguageStore.getState();
        set({ getLoading: true });
        try {
            const response = await fetch(buildEventsUrl("/api/v1/events/program", language));
            if (response.status === 404) {
                set((state) => ({
                    data: {
                        ...state.data,
                        [language]: null,
                    },
                }));
                return null;
            }
            const payload = await parseApiResponse<EventProgramPayload>(response, { showToast: false });
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
            const response = await fetch(buildEventsUrl("/api/v1/events/program", language), {
                method: "PATCH",
                cache: "no-store",
                headers,
                body: JSON.stringify(payload),
            });
            const result = await parseApiResponse<EventProgramPayload>(response);
            set((state) => ({
                data: {
                    ...state.data,
                    [language]: result.data ?? null,
                },
            }));
            toastHelper(result.message || "Event program updated successfully.", "success");
            return result.data ?? null;
        } finally {
            set({ updateLoading: false });
        }
    },
}));

