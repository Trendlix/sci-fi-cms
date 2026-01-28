import { create } from "zustand";

export type HomeLanguage = "ar" | "en";

type HomeLanguageState = {
    language: HomeLanguage;
    setLanguage: (language: HomeLanguage) => void;
    toggleLanguage: () => void;
};

export const useHomeLanguageStore = create<HomeLanguageState>((set) => ({
    language: "en",
    setLanguage: (language) => set({ language }),
    toggleLanguage: () =>
        set((state) => ({ language: state.language === "en" ? "ar" : "en" })),
}));

