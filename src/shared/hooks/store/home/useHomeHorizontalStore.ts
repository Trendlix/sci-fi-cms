import { create } from "zustand";
import { toastHelper } from "@/shared/helpers/toast.helper";
import type { HorizontalSection } from "./home.types";
import { buildHomeUrl, getAuthHeaders, parseApiResponse } from "./home.api";
import { useHomeLanguageStore, type HomeLanguage } from "./home-language.store";
import { useFirebase } from "@/shared/hooks/firebase/useFirebase";

type HorizontalUpdateSection = {
    linkType: "image" | "video" | "link";
    linkUrl?: string;
    linkFile?: File;
    title: string[];
    slogan: string;
    description: string[];
};

type HorizontalState = {
    data: Partial<Record<HomeLanguage, HorizontalSection[] | null>>;
    getLoading: boolean;
    updateLoading: boolean;
    get: () => Promise<HorizontalSection[] | null>;
    update: (payload: HorizontalUpdateSection[]) => Promise<HorizontalSection[] | null>;
};

export const useHomeHorizontalStore = create<HorizontalState>((set, get) => ({
    data: {},
    getLoading: false,
    updateLoading: false,
    get: async () => {
        const { language } = useHomeLanguageStore.getState();
        set({ getLoading: true });
        try {
            const response = await fetch(buildHomeUrl("/api/v1/home/horizontal", language), {
                cache: "no-store",
                headers: getAuthHeaders(),
            });
            const payload = await parseApiResponse<HorizontalSection[]>(response, { showToast: false });
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
            const previous = get().data?.[language] ?? [];
            const { uploadFile, deleteFile } = useFirebase.getState();
            const normalized: HorizontalSection[] = [];

            for (let index = 0; index < payload.length; index += 1) {
                const section = payload[index];
                const previousSection = previous[index];

                if (section.linkType === "link") {
                    // If switching from firebase to external link, delete the old file
                    if (previousSection?.link.type === "firebase" && previousSection.link.path) {
                        await deleteFile(previousSection.link.path);
                    }

                    normalized.push({
                        link: {
                            type: "external",
                            url: section.linkUrl ?? "",
                        },
                        title: section.title,
                        slogan: section.slogan,
                        description: section.description,
                    });
                    continue;
                }

                let url = previousSection?.link.url ?? "";
                let path = previousSection?.link.path;

                // If a new file is uploaded
                if (section.linkFile instanceof File) {
                    // Delete the old file if it exists
                    if (previousSection?.link.type === "firebase" && previousSection.link.path) {
                        await deleteFile(previousSection.link.path);
                    }

                    // Upload the new file
                    const uploadResult = await uploadFile(section.linkFile, "home-horizontal") as { url: string; path: string };
                    url = uploadResult.url;
                    path = uploadResult.path;
                }
                // If switching from one type to another (e.g., image to video) without uploading a new file
                else if (previousSection?.link.type === "firebase" &&
                    previousSection.link.contentType !== section.linkType) {
                    if (previousSection.link.path) {
                        await deleteFile(previousSection.link.path);
                    }
                    url = "";
                    path = undefined;
                }

                normalized.push({
                    link: {
                        type: "firebase",
                        url,
                        path,
                        contentType: section.linkType,
                    },
                    title: section.title,
                    slogan: section.slogan,
                    description: section.description,
                });
            }

            const response = await fetch(buildHomeUrl("/api/v1/home/horizontal", language), {
                method: "PATCH",
                cache: "no-store",
                headers: {
                    "Content-Type": "application/json",
                    ...getAuthHeaders(),
                } as HeadersInit,
                body: JSON.stringify(normalized),
            });
            const result = await parseApiResponse<HorizontalSection[]>(response);
            set((state) => ({
                data: {
                    ...state.data,
                    [language]: result.data ?? null,
                },
            }));
            toastHelper(result.message || "Horizontal sections updated successfully.", "success");
            return result.data ?? null;
        } catch (error) {
            toastHelper("Failed to update horizontal sections.", "error");
            throw error;
        } finally {
            set({ updateLoading: false });
        }
    },
}));

