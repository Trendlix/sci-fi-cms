import { create } from "zustand";

export type HomeLanguage = "ar" | "en";

const LANGUAGE_STORAGE_KEY = "cms_language";

const resolveInitialLanguage = (): HomeLanguage => {
    if (typeof window === "undefined") {
        return "en";
    }
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return stored === "ar" ? "ar" : "en";
};

type HomeLanguageState = {
    language: HomeLanguage;
    setLanguage: (language: HomeLanguage) => void;
    toggleLanguage: () => void;
};

export const useHomeLanguageStore = create<HomeLanguageState>((set) => ({
    language: resolveInitialLanguage(),
    setLanguage: (language) => {
        if (typeof window !== "undefined") {
            window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
        }
        set({ language });
    },
    toggleLanguage: () =>
        set((state) => {
            const next = state.language === "en" ? "ar" : "en";
            if (typeof window !== "undefined") {
                window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
            }
            return { language: next };
        }),
}));

