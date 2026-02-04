export type SeoBasePayload = {
    filesAlt: string;
    title: string;
    description: string;
    keywords: string[];
};

export type SeoSectionKey = "home" | "about" | "contact" | "events" | "studio" | "land";

export type SeoPayload = Record<SeoSectionKey, SeoBasePayload>;

