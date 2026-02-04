import { create } from "zustand";
import { toastHelper } from "@/shared/helpers/toast.helper";
import type { AboutPayload, ImageAsset } from "./about.types";
import { buildAboutUrl, getAuthHeaders, parseApiResponse } from "./about.api";
import { useHomeLanguageStore, type HomeLanguage } from "../home/home-language.store";
import { useFirebase } from "@/shared/hooks/firebase/useFirebase";

type AboutCardInput = {
    title: string;
    description: string;
    iconFile?: File;
};

type AboutSectionKey = "hero" | "about" | "service" | "preValue" | "value";

type AboutUpdatePayload = {
    hero: AboutPayload["hero"];
    about: {
        description: string;
        cards: AboutCardInput[];
    };
    service: AboutPayload["service"];
    preValue: {
        title: string[];
        description: string;
        linkType: "image" | "video" | "link";
        linkUrl?: string;
        linkFile?: File;
    };
    value: AboutPayload["value"];
};

type AboutState = {
    data: Partial<Record<HomeLanguage, AboutPayload | null>>;
    getLoading: boolean;
    updateLoading: boolean;
    get: (section: AboutSectionKey) => Promise<AboutPayload[AboutSectionKey] | null>;
    update: <T extends AboutSectionKey>(
        section: T,
        payload: AboutUpdatePayload[T]
    ) => Promise<AboutPayload[T] | null>;
};

export const useAboutStore = create<AboutState>((set, get) => ({
    data: {},
    getLoading: false,
    updateLoading: false,
    get: async (section) => {
        const { language } = useHomeLanguageStore.getState();
        set({ getLoading: true });
        try {
            const response = await fetch(buildAboutUrl(`/api/v1/about/${section === "preValue" ? "pre-value" : section}`, language));
            const previous = get().data?.[language] ?? ({} as AboutPayload);
            if (response.status === 404) {
                set((state) => ({
                    data: {
                        ...state.data,
                        [language]: { ...previous, [section]: null } as AboutPayload,
                    },
                }));
                return null;
            }
            const payload = await parseApiResponse<AboutPayload[AboutSectionKey]>(response, { showToast: false });
            set((state) => ({
                data: {
                    ...state.data,
                    [language]: { ...previous, [section]: payload.data } as AboutPayload,
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
    update: (async (section, payload) => {
        const { language } = useHomeLanguageStore.getState();
        set({ updateLoading: true });
        try {
            const previous = get().data?.[language];
            const { uploadFile, deleteFile } = useFirebase.getState();
            let normalized: AboutPayload[AboutSectionKey] | undefined;

            if (section === "hero") {
                normalized = payload as AboutPayload["hero"];
            }

            if (section === "service") {
                normalized = payload as AboutPayload["service"];
            }

            if (section === "value") {
                normalized = payload as AboutPayload["value"];
            }

            if (section === "about") {
                const aboutPayload = payload as AboutUpdatePayload["about"];
                const previousCards = previous?.about?.cards ?? [];
                const cards: AboutPayload["about"]["cards"] = [];

                for (let index = 0; index < aboutPayload.cards.length; index += 1) {
                    const card = aboutPayload.cards[index];
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

                if (previousCards.length > aboutPayload.cards.length) {
                    for (let index = aboutPayload.cards.length; index < previousCards.length; index += 1) {
                        const removed = previousCards[index];
                        if (removed?.icon?.path) {
                            await deleteFile(removed.icon.path);
                        }
                    }
                }

                normalized = {
                    description: aboutPayload.description,
                    cards,
                };
            }

            if (section === "preValue") {
                const preValuePayload = payload as AboutUpdatePayload["preValue"];
                const trimmedUrl = preValuePayload.linkUrl?.trim();
                let file = previous?.preValue?.file;

                if (preValuePayload.linkType === "link") {
                    if (previous?.preValue?.file?.path) {
                        await deleteFile(previous.preValue.file.path);
                    }
                    file = trimmedUrl
                        ? { url: trimmedUrl, contentType: "link" }
                        : undefined;
                } else if (preValuePayload.linkFile instanceof File) {
                    if (previous?.preValue?.file?.path) {
                        await deleteFile(previous.preValue.file.path);
                    }
                    const upload = await uploadFile(preValuePayload.linkFile, "about-pre-value");
                    file = {
                        url: upload.url,
                        path: upload.path,
                        contentType: preValuePayload.linkType,
                    };
                } else if (previous?.preValue?.file?.contentType === "link") {
                    file = undefined;
                } else if (
                    previous?.preValue?.file?.contentType &&
                    previous.preValue.file.contentType !== preValuePayload.linkType
                ) {
                    if (previous.preValue.file.path) {
                        await deleteFile(previous.preValue.file.path);
                    }
                    file = undefined;
                }

                normalized = {
                    title: preValuePayload.title,
                    description: preValuePayload.description,
                    ...(file ? { file } : {}),
                };
            }

            if (!normalized) {
                return null;
            }

            const headers: HeadersInit = {
                "Content-Type": "application/json",
                ...getAuthHeaders(),
            };
            const response = await fetch(
                buildAboutUrl(`/api/v1/about/${section === "preValue" ? "pre-value" : section}`, language),
                {
                    method: "PATCH",
                    cache: "no-store",
                    headers,
                    body: JSON.stringify(normalized),
                }
            );
            const result = await parseApiResponse<AboutPayload[AboutSectionKey]>(response);
            const updated = { ...(previous ?? ({} as AboutPayload)), [section]: result.data } as AboutPayload;
            set((state) => ({
                data: {
                    ...state.data,
                    [language]: updated,
                },
            }));
            toastHelper(result.message || "About updated successfully.", "success");
            return (result.data ?? null) as AboutPayload[typeof section] | null;
        } finally {
            set({ updateLoading: false });
        }
    }) as AboutState["update"],
}));

