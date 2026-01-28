import { create } from "zustand";
import { toastHelper } from "@/shared/helpers/toast.helper";
import type { StudioFile, StudioPartnersPayload } from "./studio.types";
import { buildStudioUrl, getAuthHeaders, parseApiResponse } from "./studio.api";
import { useHomeLanguageStore, type HomeLanguage } from "../home/home-language.store";
import { useFirebase } from "@/shared/hooks/firebase/useFirebase";

type PartnerFileInput = {
    file?: File;
    existing?: StudioFile;
};

type StudioPartnersUpdatePayload = {
    description: string;
    files: PartnerFileInput[];
};

type StudioPartnersState = {
    data: Partial<Record<HomeLanguage, StudioPartnersPayload | null>>;
    getLoading: boolean;
    updateLoading: boolean;
    get: () => Promise<StudioPartnersPayload | null>;
    update: (payload: StudioPartnersUpdatePayload) => Promise<StudioPartnersPayload | null>;
};

export const useStudioPartnersStore = create<StudioPartnersState>((set, get) => ({
    data: {},
    getLoading: false,
    updateLoading: false,
    get: async () => {
        const { language } = useHomeLanguageStore.getState();
        set({ getLoading: true });
        try {
            const response = await fetch(buildStudioUrl("/api/v1/studio/partners", language));
            const payload = await parseApiResponse<StudioPartnersPayload>(response, { showToast: false });
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
            const normalizedFiles: StudioFile[] = [];

            for (const item of payload.files) {
                if (item.file instanceof File) {
                    if (item.existing?.path) {
                        await deleteFile(item.existing.path);
                    }
                    const upload = await uploadFile(item.file, "studio-partners");
                    normalizedFiles.push({
                        url: upload.url,
                        path: upload.path,
                        contentType: item.file.type || undefined,
                    });
                } else if (item.existing?.url) {
                    normalizedFiles.push(item.existing);
                }
            }

            const keptPaths = new Set(normalizedFiles.map((file) => file.path).filter(Boolean));
            if (previous?.files?.length) {
                for (const prev of previous.files) {
                    if (prev.path && !keptPaths.has(prev.path)) {
                        await deleteFile(prev.path);
                    }
                }
            }

            const normalized: StudioPartnersPayload = {
                description: payload.description,
                files: normalizedFiles,
            };

            const headers: HeadersInit = {
                "Content-Type": "application/json",
                ...getAuthHeaders(),
            };
            const response = await fetch(buildStudioUrl("/api/v1/studio/partners", language), {
                method: "PATCH",
                headers,
                body: JSON.stringify(normalized),
            });
            const result = await parseApiResponse<StudioPartnersPayload>(response);
            set((state) => ({
                data: {
                    ...state.data,
                    [language]: result.data ?? null,
                },
            }));
            toastHelper(result.message || "Studio partners updated successfully.", "success");
            return result.data ?? null;
        } finally {
            set({ updateLoading: false });
        }
    },
}));

