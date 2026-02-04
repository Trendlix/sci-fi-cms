import { create } from "zustand";
import { toastHelper } from "@/shared/helpers/toast.helper";
import type { EventFile, EventHowPayload } from "./events.types";
import { buildEventsUrl, getAuthHeaders, parseApiResponse } from "./events.api";
import { useHomeLanguageStore, type HomeLanguage } from "../home/home-language.store";
import { useFirebase } from "@/shared/hooks/firebase/useFirebase";

type EventHowCardInput = {
    fileFile?: File;
    icon: string;
    title: string;
    description: string;
    highlights: string[];
};

type EventHowUpdatePayload = {
    description: string;
    cards: EventHowCardInput[];
};

type EventHowState = {
    data: Partial<Record<HomeLanguage, EventHowPayload | null>>;
    getLoading: boolean;
    updateLoading: boolean;
    get: () => Promise<EventHowPayload | null>;
    update: (payload: EventHowUpdatePayload) => Promise<EventHowPayload | null>;
};

export const useEventHowStore = create<EventHowState>((set, get) => ({
    data: {},
    getLoading: false,
    updateLoading: false,
    get: async () => {
        const { language } = useHomeLanguageStore.getState();
        set({ getLoading: true });
        try {
            const response = await fetch(buildEventsUrl("/api/v1/events/how", language));
            const payload = await parseApiResponse<EventHowPayload>(response, { showToast: false });
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
            const normalizedCards: EventHowPayload["cards"] = [];

            for (let index = 0; index < payload.cards.length; index += 1) {
                const card = payload.cards[index];
                const previousCard = previous?.cards?.[index];
                let file: EventFile | undefined = previousCard?.file;

                if (card.fileFile instanceof File) {
                    if (previousCard?.file?.path) {
                        await deleteFile(previousCard.file.path);
                    }
                    const upload = await uploadFile(card.fileFile, "events/how");
                    file = {
                        url: upload.url,
                        path: upload.path,
                        contentType: card.fileFile.type || undefined,
                        uploadedAt: previousCard?.file?.uploadedAt,
                    };
                }

                normalizedCards.push({
                    file,
                    icon: card.icon,
                    title: card.title,
                    description: card.description,
                    highlights: card.highlights,
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
            const response = await fetch(buildEventsUrl("/api/v1/events/how", language), {
                method: "PATCH",
                cache: "no-store",
                headers,
                body: JSON.stringify({
                    description: payload.description,
                    cards: normalizedCards,
                }),
            });
            const result = await parseApiResponse<EventHowPayload>(response);
            set((state) => ({
                data: {
                    ...state.data,
                    [language]: result.data ?? null,
                },
            }));
            toastHelper(result.message || "Event how updated successfully.", "success");
            return result.data ?? null;
        } finally {
            set({ updateLoading: false });
        }
    },
}));

