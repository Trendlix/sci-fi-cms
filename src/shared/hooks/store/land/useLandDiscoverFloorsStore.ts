import { create } from "zustand";
import { toastHelper } from "@/shared/helpers/toast.helper";
import type { LandDiscoverFloorsPayload, LandFile } from "./land.types";
import { buildLandUrl, getAuthHeaders, parseApiResponse } from "./land.api";
import { useHomeLanguageStore, type HomeLanguage } from "../home/home-language.store";
import { useFirebase } from "@/shared/hooks/firebase/useFirebase";

type DiscoverCardInput = {
    title: string;
    description: string;
    link: string;
    iconFile?: File;
};

type LandDiscoverFloorsUpdatePayload = {
    description: string;
    cards: DiscoverCardInput[];
};

type LandDiscoverFloorsState = {
    data: Partial<Record<HomeLanguage, LandDiscoverFloorsPayload | null>>;
    getLoading: boolean;
    updateLoading: boolean;
    get: () => Promise<LandDiscoverFloorsPayload | null>;
    update: (payload: LandDiscoverFloorsUpdatePayload) => Promise<LandDiscoverFloorsPayload | null>;
};

export const useLandDiscoverFloorsStore = create<LandDiscoverFloorsState>((set, get) => ({
    data: {},
    getLoading: false,
    updateLoading: false,
    get: async () => {
        const { language } = useHomeLanguageStore.getState();
        set({ getLoading: true });
        try {
            const response = await fetch(buildLandUrl("/api/v1/land/discover-floors", language));
            const payload = await parseApiResponse<LandDiscoverFloorsPayload>(response, { showToast: false });
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
            const cards: LandDiscoverFloorsPayload["cards"] = [];

            for (let index = 0; index < payload.cards.length; index += 1) {
                const card = payload.cards[index];
                const previousCard = previous?.cards?.[index];
                let icon: LandFile | undefined = previousCard?.icon ?? {};

                if (card.iconFile instanceof File) {
                    if (previousCard?.icon?.path) {
                        await deleteFile(previousCard.icon.path);
                    }
                    const upload = await uploadFile(card.iconFile, "land-discover-icons");
                    icon = {
                        url: upload.url,
                        path: upload.path,
                        contentType: card.iconFile.type || undefined,
                    };
                }

                cards.push({
                    title: card.title,
                    description: card.description,
                    link: card.link,
                    icon: icon ?? {},
                });
            }

            if (previous?.cards?.length && previous.cards.length > payload.cards.length) {
                for (let index = payload.cards.length; index < previous.cards.length; index += 1) {
                    const removed = previous.cards[index];
                    if (removed?.icon?.path) {
                        await deleteFile(removed.icon.path);
                    }
                }
            }

            const normalized: LandDiscoverFloorsPayload = {
                description: payload.description,
                cards,
            };

            const headers: HeadersInit = {
                "Content-Type": "application/json",
                ...getAuthHeaders(),
            };
            const response = await fetch(buildLandUrl("/api/v1/land/discover-floors", language), {
                method: "PATCH",
                cache: "no-store",
                headers,
                body: JSON.stringify(normalized),
            });
            const result = await parseApiResponse<LandDiscoverFloorsPayload>(response);
            set((state) => ({
                data: {
                    ...state.data,
                    [language]: result.data ?? null,
                },
            }));
            toastHelper(result.message || "Land discover floors updated successfully.", "success");
            return result.data ?? null;
        } finally {
            set({ updateLoading: false });
        }
    },
}));

