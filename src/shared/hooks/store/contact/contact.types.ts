export type ContactCard = {
    type: "phone" | "email" | "address" | "hours";
    lines: string[];
};

export type ContactPayload = {
    hero: {
        description: string;
    };
    getInTouch: {
        description: string;
        cards: ContactCard[];
    };
};

