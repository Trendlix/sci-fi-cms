import { create } from "zustand";
import { toastHelper } from "@/shared/helpers/toast.helper";
import type { SeoPayload, SeoSectionKey } from "./seo.types";
import { buildSeoUrl, getAuthHeaders, parseApiResponse } from "./seo.api";
import { useHomeLanguageStore } from "../home/home-language.store";

type SeoState = {
    data: SeoPayload | null;
    getLoading: boolean;
    updateLoading: boolean;
    get: (section: SeoSectionKey) => Promise<SeoPayload[SeoSectionKey] | null>;
    update: (section: SeoSectionKey, payload: SeoPayload[SeoSectionKey]) => Promise<SeoPayload[SeoSectionKey] | null>;
};

export const useSeoStore = create<SeoState>((set, get) => ({
    data: null,
    getLoading: false,
    updateLoading: false,
    get: async (section) => {
        const { language } = useHomeLanguageStore.getState();
        set({ getLoading: true });
        try {
            const response = await fetch(buildSeoUrl("/api/v1/seo", language));
            const payload = await parseApiResponse<SeoPayload>(response, { showToast: false });
            set({ data: payload.data ?? null });
            return payload.data?.[section] ?? null;
        } catch {
            set({ data: null });
            return null;
        } finally {
            set({ getLoading: false });
        }
    },
    update: async (section, payload) => {
        const { language } = useHomeLanguageStore.getState();
        set({ updateLoading: true });
        try {
            const current = get().data ?? ({} as SeoPayload);
            const merged = { ...current, [section]: payload } as SeoPayload;
            const headers: HeadersInit = {
                "Content-Type": "application/json",
                ...getAuthHeaders(),
            };
            const response = await fetch(buildSeoUrl("/api/v1/seo", language), {
                method: "PATCH",
                cache: "no-store",
                headers,
                body: JSON.stringify(merged),
            });
            const result = await parseApiResponse<SeoPayload>(response);
            set({ data: result.data ?? null });
            toastHelper(result.message || "Seo updated successfully.", "success");
            return result.data?.[section] ?? null;
        } finally {
            set({ updateLoading: false });
        }
    },
}));

