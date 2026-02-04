import { create } from "zustand";
import { toastHelper } from "@/shared/helpers/toast.helper";
import type { LandFile, LandHeroPayload } from "./land.types";
import { buildLandUrl, getAuthHeaders, parseApiResponse } from "./land.api";
import { useHomeLanguageStore, type HomeLanguage } from "../home/home-language.store";
import { useFirebase } from "@/shared/hooks/firebase/useFirebase";

type LandHeroInput = {
    title: string[];
    description: string;
    file: {
        linkType: "image" | "video" | "link";
        linkUrl?: string;
        fileFile?: File;
        existing?: LandFile;
    };
};

type LandHeroState = {
    data: Partial<Record<HomeLanguage, LandHeroPayload | null>>;
    getLoading: boolean;
    updateLoading: boolean;
    get: () => Promise<LandHeroPayload | null>;
    update: (payload: LandHeroInput) => Promise<LandHeroPayload | null>;
};

export const useLandHeroStore = create<LandHeroState>((set, get) => ({
    data: {},
    getLoading: false,
    updateLoading: false,
    get: async () => {
        const { language } = useHomeLanguageStore.getState();
        set({ getLoading: true });
        try {
            const response = await fetch(buildLandUrl("/api/v1/land/hero", language));
            const payload = await parseApiResponse<LandHeroPayload>(response, { showToast: false });
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
            const previous = get().data?.[language] ?? null;
            const { uploadFile, deleteFile } = useFirebase.getState();
            const fileInput = payload.file;
            let file: LandFile | undefined = fileInput.existing ?? previous?.file;

            if (fileInput.linkType === "link") {
                if (file?.path && file.contentType !== "link") {
                    await deleteFile(file.path);
                }
                const url = fileInput.linkUrl?.trim() || "";
                file = {
                    url,
                    path: url,
                    contentType: "link",
                    uploadedAt: file?.uploadedAt,
                };
            } else if (fileInput.fileFile instanceof File) {
                if (file?.path && file.contentType !== "link") {
                    await deleteFile(file.path);
                }
                const upload = await uploadFile(fileInput.fileFile, "land-hero");
                file = {
                    url: upload.url,
                    path: upload.path,
                    contentType: fileInput.linkType,
                    uploadedAt: file?.uploadedAt,
                };
            } else if (file?.contentType === "link") {
                file = undefined;
            } else if (file?.contentType && file.contentType !== fileInput.linkType) {
                if (file.path) {
                    await deleteFile(file.path);
                }
                file = undefined;
            }

            const headers: HeadersInit = {
                "Content-Type": "application/json",
                ...getAuthHeaders(),
            };
            const response = await fetch(buildLandUrl("/api/v1/land/hero", language), {
                method: "PATCH",
                cache: "no-store",
                headers,
                body: JSON.stringify({
                    title: payload.title,
                    description: payload.description,
                    ...(file ? { file } : {}),
                }),
            });
            const result = await parseApiResponse<LandHeroPayload>(response);
            set((state) => ({
                data: {
                    ...state.data,
                    [language]: result.data ?? null,
                },
            }));
            toastHelper(result.message || "Land hero updated successfully.", "success");
            return result.data ?? null;
        } finally {
            set({ updateLoading: false });
        }
    },
}));

