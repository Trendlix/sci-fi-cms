import { create } from "zustand";
import { toastHelper } from "@/shared/helpers/toast.helper";
import type { EventFile, EventUpcomingPayload } from "./events.types";
import { buildEventsUrl, getAuthHeaders, parseApiResponse } from "./events.api";
import { useHomeLanguageStore, type HomeLanguage } from "../home/home-language.store";
import { useFirebase } from "@/shared/hooks/firebase/useFirebase";

type EventUpcomingCardInput = {
    type: string;
    fileFile?: File;
    tag: string;
    title: string;
    highlights: string[];
    description: string;
    cta: string;
};

type EventUpcomingUpdatePayload = {
    cards: EventUpcomingCardInput[];
};

type EventUpcomingState = {
    data: Partial<Record<HomeLanguage, EventUpcomingPayload | null>>;
    types: Partial<Record<HomeLanguage, string[]>>;
    getLoading: boolean;
    updateLoading: boolean;
    typesLoading: boolean;
    get: () => Promise<EventUpcomingPayload | null>;
    getTypes: () => Promise<string[]>;
    update: (payload: EventUpcomingUpdatePayload) => Promise<EventUpcomingPayload | null>;
};

export const useEventUpcomingStore = create<EventUpcomingState>((set, get) => ({
    data: {},
    types: {},
    getLoading: false,
    updateLoading: false,
    typesLoading: false,
    get: async () => {
        const { language } = useHomeLanguageStore.getState();
        set({ getLoading: true });
        try {
            const response = await fetch(buildEventsUrl("/api/v1/events/upcoming", language));
            if (response.status === 404) {
                set((state) => ({
                    data: {
                        ...state.data,
                        [language]: null,
                    },
                }));
                return null;
            }
            const payload = await parseApiResponse<EventUpcomingPayload>(response, { showToast: false });
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
    getTypes: async () => {
        const { language } = useHomeLanguageStore.getState();
        set({ typesLoading: true });
        try {
            const response = await fetch(buildEventsUrl("/api/v1/events/upcoming/types", language));
            if (response.status === 404) {
                set((state) => ({
                    types: {
                        ...state.types,
                        [language]: [],
                    },
                }));
                return [];
            }
            const payload = await parseApiResponse<string[]>(response, { showToast: false });
            const types = payload.data ?? [];
            set((state) => ({
                types: {
                    ...state.types,
                    [language]: types,
                },
            }));
            return types;
        } finally {
            set({ typesLoading: false });
        }
    },
    update: async (payload) => {
        const { language } = useHomeLanguageStore.getState();
        set({ updateLoading: true });
        try {
            const previousCards = get().data?.[language] ?? [];
            const { uploadFile, deleteFile } = useFirebase.getState();
            const normalizedCards: EventUpcomingPayload = [];

            for (let index = 0; index < payload.cards.length; index += 1) {
                const card = payload.cards[index];
                const previousCard = previousCards[index];
                let file: EventFile | undefined = previousCard?.file;

                if (card.fileFile instanceof File) {
                    if (previousCard?.file?.path) {
                        await deleteFile(previousCard.file.path);
                    }
                    const upload = await uploadFile(card.fileFile, "events/upcoming");
                    file = {
                        url: upload.url,
                        path: upload.path,
                        contentType: card.fileFile.type || undefined,
                        uploadedAt: previousCard?.file?.uploadedAt,
                    };
                }

                normalizedCards.push({
                    type: card.type,
                    file,
                    tag: card.tag,
                    title: card.title,
                    highlights: card.highlights,
                    description: card.description,
                    cta: card.cta,
                });
            }

            if (previousCards.length > payload.cards.length) {
                for (let index = payload.cards.length; index < previousCards.length; index += 1) {
                    const removed = previousCards[index];
                    if (removed?.file?.path) {
                        await deleteFile(removed.file.path);
                    }
                }
            }

            const headers: HeadersInit = {
                "Content-Type": "application/json",
                ...getAuthHeaders(),
            };
            const response = await fetch(buildEventsUrl("/api/v1/events/upcoming", language), {
                method: "PATCH",
                cache: "no-store",
                headers,
                body: JSON.stringify(normalizedCards),
            });
            const result = await parseApiResponse<EventUpcomingPayload>(response);
            set((state) => ({
                data: {
                    ...state.data,
                    [language]: result.data ?? null,
                },
            }));
            toastHelper(result.message || "Event upcoming updated successfully.", "success");
            return result.data ?? null;
        } finally {
            set({ updateLoading: false });
        }
    },
}));

