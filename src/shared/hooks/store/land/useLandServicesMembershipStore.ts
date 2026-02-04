import { create } from "zustand";
import { toastHelper } from "@/shared/helpers/toast.helper";
import type { LandMembershipPayload, LandFile } from "./land.types";
import { buildLandUrl, getAuthHeaders, parseApiResponse } from "./land.api";
import { useHomeLanguageStore, type HomeLanguage } from "../home/home-language.store";
import { useFirebase } from "@/shared/hooks/firebase/useFirebase";

type LandServiceFileInput = {
    linkType: "image" | "video" | "link";
    linkUrl?: string;
    linkFile?: File;
    existing?: LandFile;
};

type LandMembershipUpdatePayload = Omit<LandMembershipPayload, "files"> & {
    files: LandServiceFileInput[];
};

type LandServicesMembershipState = {
    data: Partial<Record<HomeLanguage, LandMembershipPayload | null>>;
    getLoading: boolean;
    updateLoading: boolean;
    get: () => Promise<LandMembershipPayload | null>;
    update: (payload: LandMembershipUpdatePayload) => Promise<LandMembershipPayload | null>;
};

export const useLandServicesMembershipStore = create<LandServicesMembershipState>((set, get) => ({
    data: {},
    getLoading: false,
    updateLoading: false,
    get: async () => {
        const { language } = useHomeLanguageStore.getState();
        set({ getLoading: true });
        try {
            const response = await fetch(buildLandUrl("/api/v1/land/services/membership", language));
            const payload = await parseApiResponse<LandMembershipPayload>(response, { showToast: false });
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
            const previous = get().data?.[language];
            const { uploadFile, deleteFile } = useFirebase.getState();
            const normalizedFiles: LandFile[] = [];

            for (let index = 0; index < payload.files.length; index += 1) {
                const item = payload.files[index];
                const previousFile = previous?.files?.[index];

                if (item.linkType === "link") {
                    if (previousFile?.path && previousFile.contentType !== "link") {
                        await deleteFile(previousFile.path);
                    }
                    normalizedFiles.push({
                        url: item.linkUrl?.trim() || "",
                        path: item.linkUrl?.trim() || "",
                        contentType: "link",
                        uploadedAt: previousFile?.uploadedAt,
                    });
                    continue;
                }

                let url = previousFile?.url ?? "";
                let path = previousFile?.path;
                let contentType = item.linkType;

                if (item.linkFile instanceof File) {
                    if (previousFile?.path && previousFile.contentType !== "link") {
                        await deleteFile(previousFile.path);
                    }
                    const uploadResult = await uploadFile(item.linkFile, "land-services/membership");
                    url = uploadResult.url;
                    path = uploadResult.path;
                } else if (previousFile?.contentType === "link") {
                    url = "";
                    path = undefined;
                } else if (previousFile?.contentType && previousFile.contentType !== item.linkType) {
                    if (previousFile.path) {
                        await deleteFile(previousFile.path);
                    }
                    url = "";
                    path = undefined;
                }

                normalizedFiles.push({
                    url,
                    path,
                    contentType,
                    uploadedAt: previousFile?.uploadedAt,
                });
            }

            const headers: HeadersInit = {
                "Content-Type": "application/json",
                ...getAuthHeaders(),
            };
            const normalizedPayload: LandMembershipPayload = {
                ...payload,
                files: normalizedFiles,
            };
            const response = await fetch(buildLandUrl("/api/v1/land/services/membership", language), {
                method: "PATCH",
                cache: "no-store",
                headers,
                body: JSON.stringify(normalizedPayload),
            });
            const result = await parseApiResponse<LandMembershipPayload>(response);
            set((state) => ({
                data: {
                    ...state.data,
                    [language]: result.data ?? null,
                },
            }));
            toastHelper(result.message || "Land membership service updated successfully.", "success");
            return result.data ?? null;
        } finally {
            set({ updateLoading: false });
        }
    },
}));

