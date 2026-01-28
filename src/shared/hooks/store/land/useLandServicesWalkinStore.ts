import { create } from "zustand";
import { toastHelper } from "@/shared/helpers/toast.helper";
import type { LandWalkinFile, LandWalkinPayload } from "./land.types";
import { buildLandUrl, getAuthHeaders, parseApiResponse } from "./land.api";
import { useHomeLanguageStore, type HomeLanguage } from "../home/home-language.store";
import { useFirebase } from "@/shared/hooks/firebase/useFirebase";

type WalkinFloorFileInput = {
    tag: string;
    fileFile?: File;
    existing?: LandWalkinFile;
};

type WalkinUpdatePayload = {
    firstCards: LandWalkinPayload["firstCards"];
    lastCards: LandWalkinPayload["lastCards"];
    joinerFloor: {
        description: string[];
        files: WalkinFloorFileInput[];
    };
    geniusFloor: {
        description: string[];
        files: WalkinFloorFileInput[];
    };
};

type LandServicesWalkinState = {
    data: Partial<Record<HomeLanguage, LandWalkinPayload | null>>;
    getLoading: boolean;
    updateLoading: boolean;
    get: () => Promise<LandWalkinPayload | null>;
    update: (payload: WalkinUpdatePayload) => Promise<LandWalkinPayload | null>;
};

export const useLandServicesWalkinStore = create<LandServicesWalkinState>((set, get) => ({
    data: {},
    getLoading: false,
    updateLoading: false,
    get: async () => {
        const { language } = useHomeLanguageStore.getState();
        set({ getLoading: true });
        try {
            const response = await fetch(buildLandUrl("/api/v1/land/services/walkin", language));
            const payload = await parseApiResponse<LandWalkinPayload>(response, { showToast: false });
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
            const previous = get().data?.[language] ?? null;
            const { uploadFile, deleteFile } = useFirebase.getState();
            const normalizeFloor = async (
                floor: WalkinUpdatePayload["joinerFloor"],
                previousFloor: LandWalkinPayload["joinerFloor"] | null
            ) => {
                const normalizedFiles: LandWalkinFile[] = [];

                for (const item of floor.files) {
                    if (item.fileFile instanceof File) {
                        if (item.existing?.path) {
                            await deleteFile(item.existing.path);
                        }
                        const upload = await uploadFile(item.fileFile, "land-walkin");
                        normalizedFiles.push({
                            tag: item.tag,
                            url: upload.url,
                            path: upload.path,
                            contentType: item.fileFile.type || undefined,
                        });
                    } else if (item.existing?.url) {
                        normalizedFiles.push({
                            ...item.existing,
                            tag: item.tag,
                        });
                    }
                }

                const keptPaths = new Set(normalizedFiles.map((file) => file.path).filter(Boolean));
                if (previousFloor?.files?.length) {
                    for (const prev of previousFloor.files) {
                        if (prev.path && !keptPaths.has(prev.path)) {
                            await deleteFile(prev.path);
                        }
                    }
                }

                return {
                    description: floor.description,
                    files: normalizedFiles,
                };
            };

            const normalized: LandWalkinPayload = {
                firstCards: payload.firstCards,
                lastCards: payload.lastCards,
                joinerFloor: await normalizeFloor(payload.joinerFloor, previous?.joinerFloor ?? null),
                geniusFloor: await normalizeFloor(payload.geniusFloor, previous?.geniusFloor ?? null),
            };

            const headers: HeadersInit = {
                "Content-Type": "application/json",
                ...getAuthHeaders(),
            };
            const response = await fetch(buildLandUrl("/api/v1/land/services/walkin", language), {
                method: "PATCH",
                headers,
                body: JSON.stringify(normalized),
            });
            const result = await parseApiResponse<LandWalkinPayload>(response);
            set((state) => ({
                data: {
                    ...state.data,
                    [language]: result.data ?? null,
                },
            }));
            toastHelper(result.message || "Land walkin updated successfully.", "success");
            return result.data ?? null;
        } finally {
            set({ updateLoading: false });
        }
    },
}));

