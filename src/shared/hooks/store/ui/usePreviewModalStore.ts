import { create } from "zustand";

export type PreviewType = "link" | "image" | "video";

type PreviewPayload = {
    type: PreviewType;
    url: string;
    title?: string;
    isObjectUrl?: boolean;
};

type PreviewModalState = {
    isOpen: boolean;
    payload: PreviewPayload | null;
    open: (payload: PreviewPayload) => void;
    close: () => void;
};

export const usePreviewModalStore = create<PreviewModalState>((set, get) => ({
    isOpen: false,
    payload: null,
    open: (payload) => set({ isOpen: true, payload }),
    close: () => {
        const { payload } = get();
        if (payload?.isObjectUrl && payload.url) {
            URL.revokeObjectURL(payload.url);
        }
        set({ isOpen: false, payload: null });
    },
}));

