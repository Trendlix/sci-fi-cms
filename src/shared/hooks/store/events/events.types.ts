export type EventFile = {
    url?: string;
    path?: string;
    contentType?: string;
    uploadedAt?: string;
};

export type EventHeroCardPayload = {
    title: string[];
    description: string;
    file?: EventFile;
};

export type EventHeroPayload = {
    cards: EventHeroCardPayload[];
};

export type EventAboutCardPayload = {
    icon: string;
    title: string;
    description: string;
};

export type EventAboutPayload = {
    description: string;
    cards: EventAboutCardPayload[];
};

export type EventPartnersPayload = {
    description: string;
    files: EventFile[];
};

export type EventProgramCardPayload = {
    icon: string;
    description: string;
    features: string[];
};

export type EventProgramPayload = {
    vr_arena: EventProgramCardPayload;
    printing_lab_3d: EventProgramCardPayload;
    innovation_lab: EventProgramCardPayload;
    tech_museum: EventProgramCardPayload;
    digital_art_studio: EventProgramCardPayload;
};

export type EventHowCardPayload = {
    file?: EventFile;
    icon: string;
    title: string;
    description: string;
    highlights: string[];
};

export type EventHowPayload = {
    description: string;
    cards: EventHowCardPayload[];
};

export type EventReadyCardPayload = {
    icon: string;
    no: number;
    title: string;
};

export type EventReadyPayload = {
    description: string;
    cards: EventReadyCardPayload[];
};

export type EventFeaturedCardPayload = {
    file?: EventFile;
    tag: string;
    title: string;
    highlights: string[];
    description: string;
};

export type EventFeaturedPayload = {
    description: string;
    cards: EventFeaturedCardPayload[];
};

export type EventUpcomingCardPayload = {
    type: string;
    file?: EventFile;
    tag: string;
    title: string;
    highlights: string[];
    description: string;
    cta: string;
};

export type EventUpcomingPayload = EventUpcomingCardPayload[];

