import { BanId, BansJson, BanWord } from '@ycr/types';

declare const SCRIPT_NAME: string;
declare const BACKEND_URL: string;

const ytcPolicy = window.trustedTypes?.createPolicy('ytc-policy', {
    createHTML: (unsafeValue) => {
        return unsafeValue;
    },
});

const logger = (...args: unknown[]) => {
    console.log(`[${SCRIPT_NAME}]`, ...args);
};

const fetchBans = async () => {
    return new Promise<BansJson>(resolve => GM_xmlhttpRequest({
        method: 'GET',
        url: `${BACKEND_URL}?q=getBans`,
        onload: (res) => {
            logger(res);
            resolve(JSON.parse(res.responseText));
        },
    }));
};

const getBanIds = () => {
    return GM_getValue<BanId[]>('ids').map(x => x.id);
};

const getBanWords = () => {
    return GM_getValue<BanWord[]>('words').map(x => x.word);
};

const setupContextMenu = () => {
    const contextMenuElem = document.createElement('div');
    contextMenuElem.style.position = 'fixed';
    contextMenuElem.style.top = '-100vh';
    contextMenuElem.style.left = '-100vw';
    contextMenuElem.style.display = 'hidden';
    contextMenuElem.style.backgroundColor = 'black';

    const menuButtonElem = document.createElement('button');
    menuButtonElem.textContent = 'BAN';
    menuButtonElem.onclick = () => {
        const q = menuButtonElem.dataset.q;

        let prop: 'ids' | 'words';
        const data: Partial<BanId & BanWord> = {};

        if (q === 'pushBanId') {
            prop = 'ids';
            data.id = menuButtonElem.dataset.id;
            data.name = menuButtonElem.dataset.name;
        }
        else if (q === 'pushBanWord') {
            prop = 'words';
            data.word = menuButtonElem.dataset.word;
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

        document.querySelectorAll<HTMLElement>('ytd-comment-view-model').forEach(ban);
    };

    contextMenuElem.appendChild(menuButtonElem);
    document.body.appendChild(contextMenuElem);

    document.oncontextmenu = e => {
        if (!(e.target instanceof HTMLElement)) return;

        let isOverrideContextMenu = false;

        const selectionText = getSelection()?.toString();

        const authorTextElem = e.target.closest<HTMLAnchorElement>('#author-text');
        if (authorTextElem) {
            isOverrideContextMenu = true;

            const banId = authorTextElem.href.split('/').pop()?.slice(1);
            const banName = authorTextElem.innerText;

            menuButtonElem.dataset.q = 'pushBanId';
            menuButtonElem.dataset.id = banId;
            menuButtonElem.dataset.name = banName;
            menuButtonElem.removeAttribute('data-word');
            menuButtonElem.textContent = `BAN ID: ${banId} (${banName})`;
        }
        else if (e.target.closest('ytd-comment-view-model') && selectionText) {
            isOverrideContextMenu = true;

            const banWord = selectionText;

            menuButtonElem.dataset.q = 'pushBanWord';
            menuButtonElem.dataset.word = banWord;
            menuButtonElem.removeAttribute('data-id');
            menuButtonElem.removeAttribute('data-name');
            menuButtonElem.textContent = `BAN Word: ${banWord}`;
        }

        if (isOverrideContextMenu) {
            e.preventDefault();

            contextMenuElem.style.display = 'block';
            contextMenuElem.style.top = `${e.clientY}px`;
            contextMenuElem.style.left = `${e.clientX}px`;
        }
    };

    document.addEventListener('click', () => {
        contextMenuElem.style.display = 'none';
    });
};

/**
 * BAN判定して消す
 */
const ban = (deleteTargetElem: HTMLElement) => {
    let reason = undefined;
    const innerHtml = deleteTargetElem.innerHTML ?? '';
    if (getBanIds().some(x => innerHtml.includes(x) || innerHtml.includes(decodeURI(x)))) {
        reason = 'Included BAN ID';
    }
    else if (getBanWords().some(x => innerHtml.includes(x) || innerHtml.includes(decodeURI(x)))) {
        reason = 'Included BAN words';
    }
    if (!reason) return;

    if (deleteTargetElem.parentNode?.nodeName.toLowerCase() === 'ytd-comment-thread-renderer') {
        deleteTargetElem = deleteTargetElem.parentNode as HTMLElement;
    }

    deleteTargetElem.innerHTML = ytcPolicy?.createHTML(`
        <span
            style="
                filter: invert(100%) grayscale(100%) contrast(100);
                opacity: 0.3;
            "
        >[${SCRIPT_NAME}] 削除しました。(${reason})</span>
    `) as unknown as string;

    logger(`Deleted. (${reason})`);
};

document.addEventListener('DOMContentLoaded', () => {
    logger('Running...');

    if (!GM_getValue('ids')) GM_setValue('ids', []);
    if (!GM_getValue('words')) GM_setValue('words', []);

    setupContextMenu();

    const observer = new MutationObserver(mutationList => {
        const list = mutationList.filter(x =>
            x.target instanceof HTMLElement &&
            x.type === 'childList' &&
            x.target.tagName === 'YTD-COMMENT-VIEW-MODEL'
        );
        if (!list.length) return;

        for (const mutation of list) {
            if (mutation.target instanceof HTMLElement) {
                ban(mutation.target);
            }
        }
    });

    const commentsWaiter = setInterval(() => {
        const commentsElem = document.querySelector('#comments');
        if (commentsElem) {
            clearInterval(commentsWaiter);
            observer.observe(commentsElem, {
                childList: true,
                subtree: true,
            });
        }
    }, 100);

    // データベースと同期する
    fetchBans().then(bans => {
        GM_setValue('ids', bans.ids);
        GM_setValue('words', bans.words);
        logger('Sync BANs:', bans);
    });
});
