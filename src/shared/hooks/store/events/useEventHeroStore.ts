import { create } from "zustand";
import { toastHelper } from "@/shared/helpers/toast.helper";
import type { EventFile, EventHeroPayload } from "./events.types";
import { buildEventsUrl, getAuthHeaders, parseApiResponse } from "./events.api";
import { useHomeLanguageStore, type HomeLanguage } from "../home/home-language.store";
import { useFirebase } from "@/shared/hooks/firebase/useFirebase";

type EventHeroCardInput = {
    title: string[];
    description: string;
    fileFile?: File;
};

type EventHeroUpdatePayload = {
    cards: EventHeroCardInput[];
};

type EventHeroState = {
    data: Partial<Record<HomeLanguage, EventHeroPayload | null>>;
    getLoading: boolean;
    updateLoading: boolean;
    get: () => Promise<EventHeroPayload | null>;
    update: (payload: EventHeroUpdatePayload) => Promise<EventHeroPayload | null>;
};

export const useEventHeroStore = create<EventHeroState>((set, get) => ({
    data: {},
    getLoading: false,
    updateLoading: false,
    get: async () => {
        const { language } = useHomeLanguageStore.getState();
        set({ getLoading: true });
        try {
            const response = await fetch(buildEventsUrl("/api/v1/events/hero", language));
            if (response.status === 404) {
                set((state) => ({
                    data: {
                        ...state.data,
                        [language]: null,
                    },
                }));
                return null;
            }
            const payload = await parseApiResponse<EventHeroPayload>(response, { showToast: false });
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
            const previous = get().data?.[language];
            const { uploadFile, deleteFile } = useFirebase.getState();
            const normalizedCards: EventHeroPayload["cards"] = [];

            for (let index = 0; index < payload.cards.length; index += 1) {
                const card = payload.cards[index];
                const previousCard = previous?.cards?.[index];
                let file: EventFile | undefined = previousCard?.file;

                if (card.fileFile instanceof File) {
                    if (previousCard?.file?.path) {
                        await deleteFile(previousCard.file.path);
                    }
                    const upload = await uploadFile(card.fileFile, "events/hero");
                    file = {
                        url: upload.url,
                        path: upload.path,
                        contentType: card.fileFile.type || undefined,
                        uploadedAt: previousCard?.file?.uploadedAt,
                    };
                }

                normalizedCards.push({
                    title: card.title,
                    description: card.description,
                    file,
                });
            }

            if ((previous?.cards?.length ?? 0) > payload.cards.length) {
                for (let index = payload.cards.length; index < (previous?.cards?.length ?? 0); index += 1) {
                    const removed = previous?.cards?.[index];
                    if (removed?.file?.path) {
                        await deleteFile(removed.file.path);
                    }
                }
            }

            const headers: HeadersInit = {
                "Content-Type": "application/json",
                ...getAuthHeaders(),
            };
            const response = await fetch(buildEventsUrl("/api/v1/events/hero", language), {
                method: "PATCH",
                cache: "no-store",
                headers,
                body: JSON.stringify({ cards: normalizedCards }),
            });
            const result = await parseApiResponse<EventHeroPayload>(response);
            set((state) => ({
                data: {
                    ...state.data,
                    [language]: result.data ?? null,
                },
            }));
            toastHelper(result.message || "Event hero updated successfully.", "success");
            return result.data ?? null;
        } finally {
            set({ updateLoading: false });
        }
    },
}));

