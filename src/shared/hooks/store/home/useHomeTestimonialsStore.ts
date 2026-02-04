import { create } from "zustand";
import { toastHelper } from "@/shared/helpers/toast.helper";
import type { TestimonialPayload, AvatarPayload } from "./home.types";
import { buildHomeUrl, getAuthHeaders, parseApiResponse } from "./home.api";
import { useHomeLanguageStore } from "./home-language.store";
import { useFirebase } from "@/shared/hooks/firebase/useFirebase";

type TestimonialUpdateInput = {
    name: string;
    title?: string;
    message: string;
    rating: number;
    avatarFile?: File;
};

type TestimonialsState = {
    data: TestimonialPayload[] | null;
    getLoading: boolean;
    updateLoading: boolean;
    get: () => Promise<TestimonialPayload[] | null>;
    update: (payload: TestimonialUpdateInput[]) => Promise<TestimonialPayload[] | null>;
};

export const useHomeTestimonialsStore = create<TestimonialsState>((set, get) => ({
    data: null,
    getLoading: false,
    updateLoading: false,
    get: async () => {
        const { language } = useHomeLanguageStore.getState();
        set({ getLoading: true });
        try {
            const response = await fetch(buildHomeUrl("/api/v1/home/testimonials", language), {
                cache: "no-store",
            });
            const payload = await parseApiResponse<TestimonialPayload[]>(response, { showToast: false });
            set({ data: payload.data ?? null });
            return payload.data ?? null;
        } finally {
            set({ getLoading: false });
        }
    },
    update: async (payload) => {
        const { language } = useHomeLanguageStore.getState();
        set({ updateLoading: true });
        try {
            const previous = get().data ?? [];
            const { uploadFile, deleteFile } = useFirebase.getState();
            const normalized: TestimonialPayload[] = [];

            for (let index = 0; index < payload.length; index += 1) {
                const item = payload[index];
                const previousItem = previous[index];
                let avatar: AvatarPayload | undefined = previousItem?.avatar;

                if (item.avatarFile instanceof File) {
                    if (previousItem?.avatar?.path) {
                        await deleteFile(previousItem.avatar.path);
                    }
                    const upload = await uploadFile(item.avatarFile, "home-testimonials");
                    avatar = {
                        url: upload.url,
                        path: upload.path,
                        contentType: item.avatarFile.type || undefined,
                    };
                }

                normalized.push({
                    name: item.name,
                    title: item.title,
                    message: item.message,
                    rating: item.rating,
                    ...(avatar ? { avatar } : {}),
                });
            }

            const response = await fetch(buildHomeUrl("/api/v1/home/testimonials", language), {
                method: "PATCH",
                cache: "no-store",
                headers: {
                    "Content-Type": "application/json",
                    ...getAuthHeaders(),
                },
                body: JSON.stringify(normalized),
            });
            const result = await parseApiResponse<TestimonialPayload[]>(response);
            set({ data: result.data ?? null });
            toastHelper(result.message || "Testimonials updated successfully.", "success");
            return result.data ?? null;
        } finally {
            set({ updateLoading: false });
        }
    },
}));

