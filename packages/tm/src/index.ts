import { BanId, BansJson, BanWord } from '@ycr/types';

declare const SCRIPT_NAME: string;
declare const BACKEND_URL: string;

const ycrPolicy = window.trustedTypes?.createPolicy('ycr-policy', {
    createHTML: (unsafeValue) => {
        return unsafeValue;
    },
});

const logger = (...args: unknown[]) => {
    console.log(`[${SCRIPT_NAME}]`, ...args);
};

const appendStyle = () => {
    const styleElem = document.createElement('style');
    styleElem.setAttribute('ycr-style', '');
    styleElem.innerHTML = ycrPolicy?.createHTML(`
        .ycr-button {
            position: relative;
            background-color: var(--yt-spec-menu-background);
            color: var(--yt-spec-text-primary);
            border: none;
            border-radius: 4px;
            cursor: pointer;

            &::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                display: block;
                width: 100%;
                height: 100%;
                border-radius: inherit;
            }

            &:hover::before {
                background-color: rgba(255, 255, 255, 0.1);
            }
            &:active::before {
                background-color: rgba(255, 255, 255, 0.2);
            }
        }

        [ycr-word-ban-button] {
            position: fixed;
            top: -100vh;
            left: -100vw;
            display: none;
        }

        [ycr-id-ban-button] {
            margin-left: 0.5rem;
        }

        [ycr-banned] {
            filter: invert(100%) grayscale(100%) contrast(100);
            opacity: 0.3;
        }
    `) as unknown as string;
    document.head.appendChild(styleElem);
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

const onBanButtonClick = (e: MouseEvent) => {
    if (!(e.target instanceof HTMLElement)) return;

    const q = e.target.dataset.q;

    let prop: 'ids' | 'words';
    const data: Partial<BanId & BanWord> = {};

    if (q === 'pushBanId') {
        prop = 'ids';
        data.id = e.target.dataset.id;
        data.name = e.target.dataset.name;
    }
    else if (q === 'pushBanWord') {
        prop = 'words';
        data.word = e.target.dataset.word;
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

    document.querySelectorAll<HTMLElement>('ytd-comment-view-model').forEach(executeComment);
};

const setupWordBan = () => {
    const wordBanButton = document.createElement('button');

    wordBanButton.setAttribute('ycr-word-ban-button', '');
    wordBanButton.classList.add('ycr-button');
    wordBanButton.textContent = 'BAN';
    wordBanButton.onclick = (e) => {
        onBanButtonClick(e);
        wordBanButton.style.display = 'none';
    };

    document.body.appendChild(wordBanButton);

    document.addEventListener('mouseup', async e => {
        // 左クリックでない場合は無視
        if (e.button !== 0) return;

        // コメント領域でなければ無視
        if (!(e.target instanceof HTMLElement)) return;
        if (!e.target.closest('#comments #content')) return;

        // getSelection()で正しい値を得るためにイベントループを待機する
        await new Promise(resolve => setTimeout(resolve));

        // 要素が選択されていなければ無視
        const selection = getSelection();
        if (!selection || selection.isCollapsed) return;

        const banWord = selection.toString();

        wordBanButton.dataset.q = 'pushBanWord';
        wordBanButton.dataset.word = banWord;
        wordBanButton.textContent = `BAN Word: ${banWord}`;

        wordBanButton.style.display = 'block';
        wordBanButton.style.top = `${e.clientY}px`;
        wordBanButton.style.left = `${e.clientX}px`;
    });

    document.addEventListener('mousedown', e => {
        // 左クリックでない場合は無視
        if (e.button !== 0) return;

        // BANボタンなら無視
        if (!(e.target instanceof HTMLElement)) return;
        if (e.target.closest('[ycr-word-ban-button]')) return;

        wordBanButton.style.display = 'none';
    });
};

/**
 * BAN判定して消す
 */
const executeComment = (deleteTargetElem: HTMLElement) => {
    const headerAuthorElem = deleteTargetElem.querySelector<HTMLElement>('#header-author:not(:has([ycr-banned]))');
    if (!headerAuthorElem) return;
    const authorTextElem = headerAuthorElem.querySelector<HTMLAnchorElement>('#author-text')!;
    const contentTextElem = deleteTargetElem.querySelector<HTMLElement>('#content-text')!;

    const authorId = decodeURI(authorTextElem.href.split('/').pop()!);
    const contentText = contentTextElem.innerText;

    if (!deleteTargetElem.querySelector('[ycr-id-ban-button]')) {
        const banButtonElem = document.createElement('button');
        banButtonElem.onclick = onBanButtonClick;
        banButtonElem.setAttribute('ycr-id-ban-button', '');
        banButtonElem.classList.add('ycr-button');
        banButtonElem.dataset.q = 'pushBanId';
        banButtonElem.dataset.id = authorId;
        banButtonElem.dataset.name = authorTextElem.innerText;
        banButtonElem.textContent = 'BAN';
        headerAuthorElem.appendChild(banButtonElem);
    }

    let reason = undefined;
    if (getBanIds().some(banId => authorId === banId || contentText.includes(banId))) {
        reason = 'Included BAN ID';
    }
    else if (getBanWords().some(x => contentText.includes(x))) {
        reason = 'Included BAN words';
    }
    if (!reason) return;

    // リプライでないなら親の方に移動して丸ごと消す
    if (!deleteTargetElem.closest('#replies')) {
        const yctrElem = deleteTargetElem.closest<HTMLElement>('ytd-comment-thread-renderer');
        if (yctrElem) {
            deleteTargetElem = yctrElem;
        }
    }

    deleteTargetElem.innerHTML = ycrPolicy?.createHTML(`
        <span ycr-banned>[${SCRIPT_NAME}] 削除しました。(${reason})</span>
    `) as unknown as string;

    logger(`Deleted. (${reason})`);
};

document.addEventListener('DOMContentLoaded', () => {
    logger('Running...');

    if (!GM_getValue('ids')) GM_setValue('ids', []);
    if (!GM_getValue('words')) GM_setValue('words', []);

    appendStyle();
    setupWordBan();

    const observer = new MutationObserver(mutationList => {
        const list = mutationList.filter(x =>
            x.target instanceof HTMLElement &&
            x.type === 'childList' &&
            x.target.tagName === 'YTD-COMMENT-VIEW-MODEL'
        );
        if (!list.length) return;

        for (const mutation of list) {
            if (mutation.target instanceof HTMLElement) {
                executeComment(mutation.target);
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
