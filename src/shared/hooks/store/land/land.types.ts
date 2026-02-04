export type LandFile = {
    url?: string;
    path?: string;
    contentType?: string;
    uploadedAt?: string;
};

export type LandHeroPayload = {
    title: string[];
    description: string;
    file?: LandFile;
};

export type LandDiscoverCardPayload = {
    title: string;
    description: string;
    icon: LandFile;
    link: string;
};

export type LandDiscoverFloorsPayload = {
    description: string;
    cards: LandDiscoverCardPayload[];
};

export type LandFloorPayload = {
    title: string;
    description: string;
    file?: LandFile;
};

export type LandBirthDayPartyPackage = {
    oldPrice: number;
    price: {
        weekdays: number;
        weekends: number;
    };
    description: string[];
    highlights: string[];
};

export type LandBirthDayPartyDiamondPackage = {
    oldPrice: number;
    price: number;
    description: string[];
    highlights: string[];
};

export type LandBirthDayPartyPrincePackage = {
    title: string;
    description: string;
};

export type LandBirthDayPartyPayload = {
    price: number;
    description: string;
    files?: LandFile[];
    packages: {
        bronze: LandBirthDayPartyPackage;
        gold: LandBirthDayPartyPackage;
        diamond: LandBirthDayPartyDiamondPackage;
        prince: LandBirthDayPartyPrincePackage;
    };
};

export type LandMembershipHoursHighlight = {
    no: number;
    line: string;
};

export type LandMembershipHoursItem = {
    icon: string;
    highlight: LandMembershipHoursHighlight;
};

export type LandMembershipTotalTime = {
    icon: string;
    line: string;
};

export type LandMembershipPackageCard = {
    icon: string;
    title: string;
    hours: {
        perMonth: LandMembershipHoursItem;
        perWeek: LandMembershipHoursItem;
        perSession: LandMembershipHoursItem;
        totalTime: LandMembershipTotalTime;
    };
    oldPricePerMonth: number;
    pricePerMonth: number;
    highlights: string[];
    isPopular: boolean;
};

export type LandMembershipPayload = {
    price: number;
    description: string;
    files?: LandFile[];
    packages: {
        description: string;
        years: {
            3: LandMembershipPackageCard;
            6: LandMembershipPackageCard;
        };
    };
};

export type LandSchoolNurseryHighlightLine = {
    title: string;
    description: string;
};

export type LandSchoolNurseryHighlights = {
    icon: string;
    line: LandSchoolNurseryHighlightLine;
};

export type LandSchoolNurseryBase = {
    description: string;
    highlights: LandSchoolNurseryHighlights;
};

export type LandSchoolNurseryPayload = {
    schoolTrips: LandSchoolNurseryBase;
    nursery: LandSchoolNurseryBase;
};

export type LandWalkinCard = {
    icon: string;
    title: string;
    description: string;
};

export type LandWalkinHighlightCard = {
    icon: string;
    title: string;
    highlights: string[];
};

export type LandWalkinFile = {
    tag: string;
    url?: string;
    path?: string;
    contentType?: string;
    uploadedAt?: string;
};

export type LandWalkinFloor = {
    description: string[];
    files: LandWalkinFile[];
};

export type LandWalkinPayload = {
    firstCards: LandWalkinCard[];
    lastCards: LandWalkinHighlightCard[];
    joinerFloor: LandWalkinFloor;
    geniusFloor: LandWalkinFloor;
};

