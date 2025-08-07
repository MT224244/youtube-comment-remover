export interface BanId {
    id: string;
    name: string;
}

export interface BanWord {
    word: string;
}

export interface BanChannel {
    id: string;
    name: string;
}

export interface BanMixlist {
    id: string;
    title: string;
    name: string;
}

export interface BansJson {
    ids: BanId[];
    words: BanWord[];
    channels: BanChannel[];
    mixlists: BanMixlist[];
}
