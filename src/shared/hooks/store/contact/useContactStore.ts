import { create } from "zustand";
import { toastHelper } from "@/shared/helpers/toast.helper";
import type { ContactPayload } from "./contact.types";
import { buildContactUrl, getAuthHeaders, parseApiResponse } from "./contact.api";
import { useHomeLanguageStore, type HomeLanguage } from "../home/home-language.store";

type ContactState = {
    data: Partial<Record<HomeLanguage, ContactPayload | null>>;
    getLoading: boolean;
    updateLoading: boolean;
    get: () => Promise<ContactPayload | null>;
    update: (payload: ContactPayload) => Promise<ContactPayload | null>;
};

export const useContactStore = create<ContactState>((set) => ({
    data: {},
    getLoading: false,
    updateLoading: false,
    get: async () => {
        const { language } = useHomeLanguageStore.getState();
        set({ getLoading: true });
        try {
            const response = await fetch(buildContactUrl("/api/v1/contact", language));
            const payload = await parseApiResponse<ContactPayload>(response, { showToast: false });
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
            const response = await fetch(buildContactUrl("/api/v1/contact", language), {
                method: "PATCH",
                cache: "no-store",
                headers,
                body: JSON.stringify(payload),
            });
            const result = await parseApiResponse<ContactPayload>(response);
            set((state) => ({
                data: {
                    ...state.data,
                    [language]: result.data ?? null,
                },
            }));
            toastHelper(result.message || "Contact updated successfully.", "success");
            return result.data ?? null;
        } finally {
            set({ updateLoading: false });
        }
    },
}));

