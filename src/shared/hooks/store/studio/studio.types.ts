export type StudioFile = {
    url?: string;
    path?: string;
    contentType?: string;
    uploadedAt?: string;
};

export type StudioHeroPayload = {
    title: string[];
    description: string;
};

export type StudioAboutCardPayload = {
    tag: string;
    file?: StudioFile;
    icon: string;
    title: string;
    description: string;
};

export type StudioAboutPayload = {
    description: string;
    cards: StudioAboutCardPayload[];
};

export type StudioPartnersPayload = {
    description: string;
    files: StudioFile[];
};

export type StudioWhyUsLinePayload = {
    icon: string;
    line: string;
};

export type StudioWhyUsPayload = {
    description: string;
    lines: StudioWhyUsLinePayload[];
};

