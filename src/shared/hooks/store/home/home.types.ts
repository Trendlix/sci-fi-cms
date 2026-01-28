export type HeroPayload = {
    title: string[];
    description: string;
};

export type AboutPayload = {
    description: string[];
};

export type HorizontalLink = {
    type: "firebase" | "external";
    url: string;
    path?: string;
    contentType?: string;
};

export type HorizontalSection = {
    link: HorizontalLink;
    title: string[];
    slogan: string;
    description: string[];
};

export type AvatarPayload = {
    url?: string;
    path?: string;
    contentType?: string;
    uploadedAt?: string;
};

export type TestimonialPayload = {
    name: string;
    title?: string;
    message: string;
    rating: number;
    avatar?: AvatarPayload;
};

export type LocationPayload = {
    title: string;
    address: string;
    mapUrl: string;
};

