import { useEffect } from "react";
import { useHomeLanguageStore } from "@/shared/hooks/store/home/home-language.store";

const CommonLanguageSwitcherCheckbox = () => {
    const language = useHomeLanguageStore((state) => state.language);
    const setLanguage = useHomeLanguageStore((state) => state.setLanguage);

    useEffect(() => {
        if (language !== "en" && language !== "ar") {
            setLanguage("en");
        }
    }, [language, setLanguage]);

    return (
        <div className="flex items-center gap-4 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm">
            <label className="flex items-center gap-2">
                <input
                    type="radio"
                    name="home-language"
                    checked={language === "en"}
                    onChange={() => setLanguage("en")}
                    className="h-3 w-3 accent-gray-800"
                />
                <span className="text-white/80">English</span>
            </label>
            <label className="flex items-center gap-2">
                <input
                    type="radio"
                    name="home-language"
                    checked={language === "ar"}
                    onChange={() => setLanguage("ar")}
                    className="h-3 w-3 accent-gray-800"
                />
                <span className="text-white/80">Arabic</span>
            </label>
        </div>
    );
};

export default CommonLanguageSwitcherCheckbox;

