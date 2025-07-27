export type BanId = {
    id: string;
    name: string;
};

export type BanWord = {
    word: string;
};

export type BansJson = {
    ids: BanId[];
    words: BanWord[];
};
