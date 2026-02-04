import { create } from "zustand";
import { toastHelper } from "@/shared/helpers/toast.helper";
import type { StudioAboutPayload, StudioFile } from "./studio.types";
import { buildStudioUrl, getAuthHeaders, parseApiResponse } from "./studio.api";
import { useHomeLanguageStore, type HomeLanguage } from "../home/home-language.store";
import { useFirebase } from "@/shared/hooks/firebase/useFirebase";

type StudioAboutCardInput = {
    tag: string;
    icon: string;
    title: string;
    description: string;
    fileFile?: File;
};

type StudioAboutUpdatePayload = {
    description: string;
    cards: StudioAboutCardInput[];
};

type StudioAboutState = {
    data: Partial<Record<HomeLanguage, StudioAboutPayload | null>>;
    getLoading: boolean;
    updateLoading: boolean;
    get: () => Promise<StudioAboutPayload | null>;
    update: (payload: StudioAboutUpdatePayload) => Promise<StudioAboutPayload | null>;
};

export const useStudioAboutStore = create<StudioAboutState>((set, get) => ({
    data: {},
    getLoading: false,
    updateLoading: false,
    get: async () => {
        const { language } = useHomeLanguageStore.getState();
        set({ getLoading: true });
        try {
            const response = await fetch(buildStudioUrl("/api/v1/studio/about", language));
            const payload = await parseApiResponse<StudioAboutPayload>(response, { showToast: false });
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
            const normalized: StudioAboutPayload = {
                description: payload.description,
                cards: [],
            };

            for (let index = 0; index < payload.cards.length; index += 1) {
                const card = payload.cards[index];
                const previousCard = previous?.cards?.[index];
                let file: StudioFile | undefined = previousCard?.file;

                if (card.fileFile instanceof File) {
                    if (previousCard?.file?.path) {
                        await deleteFile(previousCard.file.path);
                    }
                    const upload = await uploadFile(card.fileFile, "studio-about");
                    file = {
                        url: upload.url,
                        path: upload.path,
                        contentType: card.fileFile.type || undefined,
                    };
                }

                normalized.cards.push({
                    tag: card.tag,
                    icon: card.icon,
                    title: card.title,
                    description: card.description,
                    ...(file ? { file } : {}),
                });
            }

            if (previous?.cards?.length && previous.cards.length > payload.cards.length) {
                for (let index = payload.cards.length; index < previous.cards.length; index += 1) {
                    const removed = previous.cards[index];
                    if (removed?.file?.path) {
                        await deleteFile(removed.file.path);
                    }
                }
            }

            const headers: HeadersInit = {
                "Content-Type": "application/json",
                ...getAuthHeaders(),
            };
            const response = await fetch(buildStudioUrl("/api/v1/studio/about", language), {
                method: "PATCH",
                cache: "no-store",
                headers,
                body: JSON.stringify(normalized),
            });
            const result = await parseApiResponse<StudioAboutPayload>(response);
            set((state) => ({
                data: {
                    ...state.data,
                    [language]: result.data ?? null,
                },
            }));
            toastHelper(result.message || "Studio about updated successfully.", "success");
            return result.data ?? null;
        } finally {
            set({ updateLoading: false });
        }
    },
}));

