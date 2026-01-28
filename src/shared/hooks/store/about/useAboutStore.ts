import { create } from "zustand";
import { toastHelper } from "@/shared/helpers/toast.helper";
import type { AboutPayload, ImageAsset } from "./about.types";
import { buildAboutUrl, getAuthHeaders, parseApiResponse } from "./about.api";
import { useHomeLanguageStore } from "../home/home-language.store";
import { useFirebase } from "@/shared/hooks/firebase/useFirebase";

type AboutCardInput = {
    title: string;
    description: string;
    iconFile?: File;
};

type AboutUpdatePayload = {
    hero?: AboutPayload["hero"];
    about?: {
        description: string;
        cards: AboutCardInput[];
    };
    service?: AboutPayload["service"];
    preValue?: {
        title: string[];
        description: string;
        linkType: "image" | "video" | "link";
        linkUrl?: string;
        linkFile?: File;
    };
    value?: AboutPayload["value"];
};

type AboutState = {
    data: AboutPayload | null;
    getLoading: boolean;
    updateLoading: boolean;
    get: () => Promise<AboutPayload | null>;
    update: (payload: AboutUpdatePayload) => Promise<AboutPayload | null>;
};

export const useAboutStore = create<AboutState>((set, get) => ({
    data: null,
    getLoading: false,
    updateLoading: false,
    get: async () => {
        const { language } = useHomeLanguageStore.getState();
        set({ getLoading: true });
        try {
            const response = await fetch(buildAboutUrl("/api/v1/about", language));
            const payload = await parseApiResponse<AboutPayload>(response, { showToast: false });
            set({ data: payload.data ?? null });
            return payload.data ?? null;
        } catch {
            set({ data: null });
            return null;
        } finally {
            set({ getLoading: false });
        }
    },
    update: async (payload) => {
        const { language } = useHomeLanguageStore.getState();
        set({ updateLoading: true });
        try {
            const previous = get().data;
            const { uploadFile, deleteFile } = useFirebase.getState();
            const normalized: Partial<AboutPayload> = {};

            if (payload.hero) {
                normalized.hero = payload.hero;
            }

            if (payload.service) {
                normalized.service = payload.service;
            }

            if (payload.value) {
                normalized.value = payload.value;
            }

            if (payload.about) {
                const previousCards = previous?.about?.cards ?? [];
                const cards: AboutPayload["about"]["cards"] = [];

                for (let index = 0; index < payload.about.cards.length; index += 1) {
                    const card = payload.about.cards[index];
                    const previousCard = previousCards[index];
                    let icon: ImageAsset | undefined = previousCard?.icon ?? {};

                    if (card.iconFile instanceof File) {
                        if (previousCard?.icon?.path) {
                            await deleteFile(previousCard.icon.path);
                        }
                        const upload = await uploadFile(card.iconFile, "about-icons");
                        icon = {
                            url: upload.url,
                            path: upload.path,
                            contentType: card.iconFile.type || undefined,
                        };
                    }

                    cards.push({
                        title: card.title,
                        description: card.description,
                        icon: icon ?? {},
                    });
                }

                if (previousCards.length > payload.about.cards.length) {
                    for (let index = payload.about.cards.length; index < previousCards.length; index += 1) {
                        const removed = previousCards[index];
                        if (removed?.icon?.path) {
                            await deleteFile(removed.icon.path);
                        }
                    }
                }

                normalized.about = {
                    description: payload.about.description,
                    cards,
                };
            }

            if (payload.preValue) {
                const trimmedUrl = payload.preValue.linkUrl?.trim();
                let file = previous?.preValue?.file;

                if (payload.preValue.linkType === "link") {
                    if (previous?.preValue?.file?.path) {
                        await deleteFile(previous.preValue.file.path);
                    }
                    file = trimmedUrl
                        ? { url: trimmedUrl, contentType: "link" }
                        : undefined;
                } else if (payload.preValue.linkFile instanceof File) {
                    if (previous?.preValue?.file?.path) {
                        await deleteFile(previous.preValue.file.path);
                    }
                    const upload = await uploadFile(payload.preValue.linkFile, "about-pre-value");
                    file = {
                        url: upload.url,
                        path: upload.path,
                        contentType: payload.preValue.linkType,
                    };
                } else if (previous?.preValue?.file?.contentType === "link") {
                    file = undefined;
                } else if (
                    previous?.preValue?.file?.contentType &&
                    previous.preValue.file.contentType !== payload.preValue.linkType
                ) {
                    if (previous.preValue.file.path) {
                        await deleteFile(previous.preValue.file.path);
                    }
                    file = undefined;
                }

                normalized.preValue = {
                    title: payload.preValue.title,
                    description: payload.preValue.description,
                    ...(file ? { file } : {}),
                };
            }

            const headers: HeadersInit = {
                "Content-Type": "application/json",
                ...getAuthHeaders(),
            };
            const response = await fetch(buildAboutUrl("/api/v1/about", language), {
                method: "PATCH",
                headers,
                body: JSON.stringify(normalized),
            });
            const result = await parseApiResponse<AboutPayload>(response);
            set({ data: result.data ?? null });
            toastHelper(result.message || "About updated successfully.", "success");
            return result.data ?? null;
        } finally {
            set({ updateLoading: false });
        }
    },
}));

