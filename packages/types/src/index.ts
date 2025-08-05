export type BanId = {
    id: string;
    name: string;
};

export type BanWord = {
    word: string;
};

export type BanChannel = {
    id: string;
    name: string;
};

export type BanMixlist = {
    id: string;
    title: string;
    name: string;
};

export type BansJson = {
    ids: BanId[];
    words: BanWord[];
    channels: BanChannel[];
    mixlists: BanMixlist[];
};
