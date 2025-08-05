import { BanChannel, BanId, BanMixlist, BanWord } from '@ycr/types';

export const ycrPolicy = window.trustedTypes?.createPolicy('ycr-policy', {
    createHTML: (unsafeValue) => {
        return unsafeValue;
    },
});

export const logger = (...args: unknown[]) => {
    console.log(`[${SCRIPT_NAME}]`, ...args);
};

export const getBanIds = () => {
    return GM_getValue<BanId[]>('ids').map(x => x.id);
};

export const getBanWords = () => {
    return GM_getValue<BanWord[]>('words').map(x => x.word);
};

export const getBanChannels = () => {
    return GM_getValue<BanChannel[]>('channels').map(x => x.id);
};

export const getBanMixlists = () => {
    return GM_getValue<BanMixlist[]>('mixlists').map(x => x.id);
};

/**
 * GASにBAN対象データを送信する
 * @param e
 */
export const pushBan = (e: MouseEvent) => {
    if (!(e.target instanceof HTMLElement)) return;

    const q = e.target.dataset.ycrQuery;

    let prop: 'ids' | 'words' | 'channels' | 'mixlists';
    const data: Partial<
        & BanId
        & BanWord
        & BanChannel
        & BanMixlist
    > = {};

    if (q === 'pushBanId') {
        prop = 'ids';
        data.id = e.target.dataset.ycrId;
        data.name = e.target.dataset.ycrName;
    }
    else if (q === 'pushBanWord') {
        prop = 'words';
        data.word = e.target.dataset.ycrWord;
    }
    else if (q === 'pushBanChannel') {
        prop = 'channels';
        data.id = e.target.dataset.ycrId;
        data.name = e.target.dataset.ycrName;
    }
    else if (q === 'pushBanMixlist') {
        prop = 'mixlists';
        data.id = e.target.dataset.ycrId;
        data.title = e.target.dataset.ycrTitle;
        data.name = e.target.dataset.ycrName;
    }
    else return;

    GM_setValue(prop, [
        ...GM_getValue<BanId[] | BanWord[]>(prop),
        data,
    ]);

    GM_xmlhttpRequest({
        method: 'POST',
        url: `${BACKEND_URL}?q=${q}`,
        data: JSON.stringify(data),
        onload: (res) => {
            logger(res);
            logger(JSON.parse(res.responseText));
        },
    });

    logger('BAN', q, prop, data);
};

/**
 * ESCキーを押したイベントを発火する
 */
export const pressEscKey = (elem: HTMLElement) => {
    elem.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Escape',
        code: 'Escape',
        bubbles: true,
        cancelable: true,
    }));
};
