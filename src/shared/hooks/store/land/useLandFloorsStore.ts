import { create } from "zustand";
import { toastHelper } from "@/shared/helpers/toast.helper";
import type { LandFloorPayload, LandFile } from "./land.types";
import { buildLandUrl, getAuthHeaders, parseApiResponse } from "./land.api";
import { useHomeLanguageStore, type HomeLanguage } from "../home/home-language.store";
import { useFirebase } from "@/shared/hooks/firebase/useFirebase";

type FloorInput = {
    title: string;
    description: string;
    linkType: "image" | "video" | "link";
    linkUrl?: string;
    fileFile?: File;
    existing?: LandFile;
};

type LandFloorsState = {
    data: Partial<Record<HomeLanguage, LandFloorPayload[] | null>>;
    getLoading: boolean;
    updateLoading: boolean;
    get: () => Promise<LandFloorPayload[] | null>;
    update: (payload: FloorInput[]) => Promise<LandFloorPayload[] | null>;
};

export const useLandFloorsStore = create<LandFloorsState>((set, get) => ({
    data: {},
    getLoading: false,
    updateLoading: false,
    get: async () => {
        const { language } = useHomeLanguageStore.getState();
        set({ getLoading: true });
        try {
            const response = await fetch(buildLandUrl("/api/v1/land/floors", language));
            const payload = await parseApiResponse<LandFloorPayload[]>(response, { showToast: false });
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
            const normalized: LandFloorPayload[] = [];

            for (let index = 0; index < payload.length; index += 1) {
                const floor = payload[index];
                const previousFloor = previous[index];
                let file: LandFile | undefined = floor.existing ?? previousFloor?.file;

                if (floor.linkType === "link") {
                    if (file?.path && file.contentType !== "link") {
                        await deleteFile(file.path);
                    }
                    const url = floor.linkUrl?.trim() || "";
                    file = {
                        url,
                        path: url,
                        contentType: "link",
                        uploadedAt: file?.uploadedAt,
                    };
                } else if (floor.fileFile instanceof File) {
                    if (file?.path && file.contentType !== "link") {
                        await deleteFile(file.path);
                    }
                    const upload = await uploadFile(floor.fileFile, "land-floors");
                    file = {
                        url: upload.url,
                        path: upload.path,
                        contentType: floor.linkType,
                    };
                } else if (file?.contentType === "link") {
                    file = undefined;
                } else if (file?.contentType && file.contentType !== floor.linkType) {
                    if (file.path) {
                        await deleteFile(file.path);
                    }
                    file = undefined;
                }

                normalized.push({
                    title: floor.title,
                    description: floor.description,
                    ...(file ? { file } : {}),
                });
            }

            if (previous.length > payload.length) {
                for (let index = payload.length; index < previous.length; index += 1) {
                    const removed = previous[index];
                    if (removed?.file?.path && removed.file.contentType !== "link") {
                        await deleteFile(removed.file.path);
                    }
                }
            }

            const headers: HeadersInit = {
                "Content-Type": "application/json",
                ...getAuthHeaders(),
            };
            const response = await fetch(buildLandUrl("/api/v1/land/floors", language), {
                method: "PATCH",
                cache: "no-store",
                headers,
                body: JSON.stringify(normalized),
            });
            const result = await parseApiResponse<LandFloorPayload[]>(response);
            set((state) => ({
                data: {
                    ...state.data,
                    [language]: result.data ?? null,
                },
            }));
            toastHelper(result.message || "Land floors updated successfully.", "success");
            return result.data ?? null;
        } finally {
            set({ updateLoading: false });
        }
    },
}));

