import { create } from "zustand";
import { toastHelper } from "@/shared/helpers/toast.helper";
import type { EventFile, EventPartnersPayload } from "./events.types";
import { buildEventsUrl, getAuthHeaders, parseApiResponse } from "./events.api";
import { useHomeLanguageStore, type HomeLanguage } from "../home/home-language.store";
import { useFirebase } from "@/shared/hooks/firebase/useFirebase";

type PartnerFileInput = {
    file?: File;
    existing?: EventFile;
};

type EventPartnersUpdatePayload = {
    description: string;
    files: PartnerFileInput[];
};

type EventPartnersState = {
    data: Partial<Record<HomeLanguage, EventPartnersPayload | null>>;
    getLoading: boolean;
    updateLoading: boolean;
    get: () => Promise<EventPartnersPayload | null>;
    update: (payload: EventPartnersUpdatePayload) => Promise<EventPartnersPayload | null>;
};

export const useEventPartnersStore = create<EventPartnersState>((set, get) => ({
    data: {},
    getLoading: false,
    updateLoading: false,
    get: async () => {
        const { language } = useHomeLanguageStore.getState();
        set({ getLoading: true });
        try {
            const response = await fetch(buildEventsUrl("/api/v1/events/partners", language));
            if (response.status === 404) {
                set((state) => ({
                    data: {
                        ...state.data,
                        [language]: null,
                    },
                }));
                return null;
            }
            const payload = await parseApiResponse<EventPartnersPayload>(response, { showToast: false });
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
            const normalizedFiles: EventFile[] = [];

            for (const item of payload.files) {
                if (item.file instanceof File) {
                    if (item.existing?.path) {
                        await deleteFile(item.existing.path);
                    }
                    const upload = await uploadFile(item.file, "events/partners");
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

            const normalized: EventPartnersPayload = {
                description: payload.description,
                files: normalizedFiles,
            };

            const headers: HeadersInit = {
                "Content-Type": "application/json",
                ...getAuthHeaders(),
            };
            const response = await fetch(buildEventsUrl("/api/v1/events/partners", language), {
                method: "PATCH",
                cache: "no-store",
                headers,
                body: JSON.stringify(normalized),
            });
            const result = await parseApiResponse<EventPartnersPayload>(response);
            set((state) => ({
                data: {
                    ...state.data,
                    [language]: result.data ?? null,
                },
            }));
            toastHelper(result.message || "Event partners updated successfully.", "success");
            return result.data ?? null;
        } finally {
            set({ updateLoading: false });
        }
    },
}));

