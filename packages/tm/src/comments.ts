import { getBanIds, getBanWords, logger, pressEscKey, pushBan } from './lib';

const idBanButtonElem = document.createElement('button');
idBanButtonElem.classList.add('ycr-menu-button');
idBanButtonElem.textContent = 'BAN';

/**
 * コメント文字選択でBANメニューを出す
 */
export const setupWordBan = () => {
    const wordBanButtonContainer = document.createElement('div');
    wordBanButtonContainer.classList.add('ycr-menu');

    const wordBanButton = document.createElement('button');
    wordBanButton.id = 'ycr-word-ban-button';
    wordBanButton.classList.add('ycr-menu-button');
    wordBanButton.textContent = 'BAN';
    wordBanButton.onclick = (e) => {
        pushBan(e);
        wordBanButtonContainer.style.display = 'none';
        updateComments();
    };
    wordBanButtonContainer.appendChild(wordBanButton);

    document.body.appendChild(wordBanButtonContainer);

    document.addEventListener('mouseup', async (e) => {
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

        wordBanButton.dataset.ycrQuery = 'pushBanWord';
        wordBanButton.dataset.ycrWord = banWord;
        wordBanButton.textContent = `BAN Word: ${banWord}`;

        wordBanButtonContainer.style.display = 'block';
        wordBanButtonContainer.style.top = `${e.clientY}px`;
        wordBanButtonContainer.style.left = `${e.clientX}px`;
    });

    document.addEventListener('mousedown', (e) => {
        // 左クリックでない場合は無視
        if (e.button !== 0) return;

        // BANボタンなら無視
        if (!(e.target instanceof HTMLElement)) return;
        if (e.target.closest('#ycr-word-ban-button')) return;

        wordBanButtonContainer.style.display = 'none';
    });
};

/**
 * メニューボタンにクリックイベントを生やして項目を埋め込む
 * @param elem
 * @param videoData
 */
const setupMenuButton = (elem: HTMLElement, id: string, name: string) => {
    const buttonElem = elem.querySelector<HTMLElement>('ytd-menu-renderer');

    if (buttonElem && !buttonElem.hasAttribute('ycr-menu-button')) {
        buttonElem.setAttribute('ycr-menu-button', '');

        buttonElem.addEventListener('click', () => {
            const listElem = document.querySelector<HTMLElement>(
                'ytd-popup-container > tp-yt-iron-dropdown tp-yt-paper-listbox',
            );
            if (!listElem) return;

            idBanButtonElem.onclick = (e) => {
                pushBan(e);
                pressEscKey(idBanButtonElem);
                updateComments();
            };
            idBanButtonElem.textContent = 'BAN ID';
            idBanButtonElem.dataset.ycrQuery = 'pushBanId';
            idBanButtonElem.dataset.ycrId = id;
            idBanButtonElem.dataset.ycrName = name;
            listElem.appendChild(idBanButtonElem);
        });
    }
};

/**
 * IDがBAN対象か判定する
 * @param id
 */
const isBanId = (id: string | undefined) => {
    return getBanIds().some(banId => id === banId);
};

/**
 * ワードがBAN対象か判定する
 * @param text
 */
const isBanWord = (text: string) => {
    return getBanWords().some(banWord => text.includes(banWord));
};

/**
 * BAN状況をUIのコメント欄に反映する
 */
const updateComments = () => {
    document
        .querySelectorAll<HTMLElement>('ytd-comment-view-model')
        .forEach(executeComment);
};

/**
 * コメントをBAN判定して消す
 * @param deleteTargetElem
 */
const executeComment = async (deleteTargetElem: HTMLElement) => {
    // これが無いとcontentTextが取れないことがある
    await new Promise(resolve => setTimeout(resolve));

    const headerAuthorElem = deleteTargetElem.querySelector<HTMLElement>('#header-author:not(:has([ycr-banned]))');
    if (!headerAuthorElem) return;

    const authorTextElem = headerAuthorElem.querySelector<HTMLAnchorElement>('#author-text')!;
    const contentTextElem = deleteTargetElem.querySelector<HTMLElement>('#content-text')!;

    const authorId = decodeURI(authorTextElem.href.split('/').pop()!);
    const authorName = authorTextElem.innerText;
    const contentText = contentTextElem.innerText;

    let reason = undefined;
    if (isBanId(authorId)) {
        reason = 'Reason: BAN ID';
    }
    else if (isBanWord(contentText)) {
        reason = 'Reason: BAN Word';
    }

    // BAN理由があれば消す
    if (reason) {
        // リプライでないなら親の方に移動して丸ごと消す
        if (!deleteTargetElem.closest('#replies')) {
            const yctrElem = deleteTargetElem.closest<HTMLElement>('ytd-comment-thread-renderer');
            if (yctrElem) {
                deleteTargetElem = yctrElem;
            }
        }

        deleteTargetElem.setAttribute('ycr-banned', `[${SCRIPT_NAME}] Deleted. (${reason})`);
        logger(`Deleted. (${reason})`);
    }

    setupMenuButton(deleteTargetElem, authorId, authorName);
};

export const commentsObserver = new MutationObserver((mutationList) => {
    const list = mutationList.filter(x =>
        x.target instanceof HTMLElement &&
        x.type === 'childList' &&
        x.target.tagName === 'YTD-COMMENT-VIEW-MODEL' &&
        !x.target.hasAttribute('ycr-banned'),
    );
    if (!list.length) return;

    for (const mutation of list) {
        if (mutation.target instanceof HTMLElement) {
            void executeComment(mutation.target);
        }
    }
});
