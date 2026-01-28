export type ImageAsset = {
    url?: string;
    path?: string;
    contentType?: string;
    uploadedAt?: string;
};

export type AboutHeroPayload = {
    title: string[];
    description: string;
};

export type AboutCardPayload = {
    icon: ImageAsset;
    title: string;
    description: string;
};

export type AboutMinPayload = {
    description: string;
    cards: AboutCardPayload[];
};

export type ServiceCardPayload = {
    tag: string;
    icon: string;
    title: string;
    description: string;
};

export type ServicePayload = {
    description: string;
    cards: ServiceCardPayload[];
};

export type PreValuePayload = {
    title: string[];
    description: string;
    file?: ImageAsset;
};

export type ValueCardPayload = {
    icon: string;
    title: string;
    description: string;
};

export type ValuePayload = {
    description: string;
    cards: ValueCardPayload[];
};

export type AboutPayload = {
    hero: AboutHeroPayload;
    about: AboutMinPayload;
    service: ServicePayload;
    preValue: PreValuePayload;
    value: ValuePayload;
};

