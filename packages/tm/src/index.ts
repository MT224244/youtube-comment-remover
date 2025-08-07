import type { BansJson } from '@ycr/types';

import { channelsObserver } from './channels';
import { commentsObserver, setupWordBan } from './comments';
import { endscreenObserver } from './endscreen';
import { logger, ycrPolicy } from './lib';

const appendStyle = () => {
    const styleElem = document.createElement('style');
    styleElem.setAttribute('ycr-style', '');
    styleElem.innerHTML = ycrPolicy?.createHTML(`
        .ycr-menu-button {
            position: relative;
            width: 100%;
            padding: 12px 16px;
            background-color: transparent;
            color: var(--yt-spec-text-primary);
            border: none;
            text-align: left;
            white-space: nowrap;
            cursor: pointer;

            &::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                display: block;
                width: 100%;
                height: 100%;
            }

            &:hover {
                background-color: var(--yt-spec-10-percent-layer);
            }
            &:active::before {
                background-color: var(--yt-spec-10-percent-layer);
            }
        }

        .ycr-menu:has(#ycr-word-ban-button) {
            position: fixed;
            top: -100vh;
            left: -100vw;
            display: none;
            padding: 8px 0;
            background-color: var(--yt-spec-menu-background);
            border-radius: 12px;
            z-index: 10000;
        }

        [ycr-banned] {
            display: block;

            * {
                display: none;
            }
            &::before {
                content: attr(ycr-banned);
                display: block;
                filter: invert(100%) grayscale(100%) contrast(100);
                opacity: 0.3;
            }
        }

        .ytp-endscreen-content > [ycr-banned] {
            border: 1px solid rgb(255 255 255 / 10%);
            border-radius: 4px;
            pointer-events: none;

            &::before {
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100%;
                color: black;
            }
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
            resolve(JSON.parse(res.responseText) as BansJson);
        },
    }));
};

document.addEventListener('DOMContentLoaded', () => {
    logger('Running...');

    if (!GM_getValue('ids')) GM_setValue('ids', []);
    if (!GM_getValue('words')) GM_setValue('words', []);
    if (!GM_getValue('channels')) GM_setValue('channels', []);
    if (!GM_getValue('mixlists')) GM_setValue('mixlists', []);

    appendStyle();
    setupWordBan();

    let foundComments = false;
    let foundChannels = false;
    let foundEndscreen = false;

    // 監視対象要素の事前存在確認
    {
        const elem = document.querySelector('#comments');
        if (elem) {
            foundComments = true;
            commentsObserver.observe(elem, { childList: true, subtree: true });
        }
    }
    {
        const elem = document.querySelector('ytd-watch-next-secondary-results-renderer');
        if (elem) {
            foundChannels = true;
            channelsObserver.observe(elem, { childList: true, subtree: true });
        }
    }
    {
        const elem = document.querySelector('.ytp-endscreen-content');
        if (elem) {
            foundEndscreen = true;
            endscreenObserver.observe(elem, { childList: true, subtree: true });
        }
    }

    const observer = new MutationObserver((mutationList) => {
        const list = mutationList.filter(x =>
            x.target instanceof HTMLElement &&
            x.type === 'childList',
        );

        if (!foundComments) {
            const mutation = list.find(x =>
                x.target instanceof HTMLElement &&
                x.target.id === 'comments',
            );
            if (mutation) {
                foundComments = true;
                commentsObserver.observe(mutation.target, { childList: true, subtree: true });
            }
        }

        if (!foundChannels) {
            const mutation = list.find(x =>
                x.target instanceof HTMLElement &&
                x.target.tagName === 'YTD-WATCH-NEXT-SECONDARY-RESULTS-RENDERER',
            );
            if (mutation) {
                foundChannels = true;
                channelsObserver.observe(mutation.target, { childList: true, subtree: true });
            }
        }

        if (!foundEndscreen) {
            const elem = document.querySelector('.ytp-endscreen-content');
            if (elem) {
                foundEndscreen = true;
                endscreenObserver.observe(elem, { childList: true, subtree: true });
            }
        }

        if (foundComments && foundChannels && foundEndscreen) {
            observer.disconnect();
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // データベースと同期する
    fetchBans().then((bans) => {
        GM_setValue('ids', bans.ids);
        GM_setValue('words', bans.words);
        GM_setValue('channels', bans.channels);
        GM_setValue('mixlists', bans.mixlists);
        logger('Sync BANs:', bans);
    }).catch(() => { /* */ });
});
