import { updateEndscreen } from './endscreen';
import {
    getBanChannels,
    getBanMixlists,
    logger,
    pressEscKey,
    pushBan,
    VideoData,
    videoDataList,
} from './lib';

const videoBanButtonElem = document.createElement('button');
videoBanButtonElem.classList.add('ycr-menu-button');
videoBanButtonElem.textContent = 'BAN';

/**
 * メニューボタンにクリックイベントを生やして項目を埋め込む
 * @param elem
 * @param videoData
 */
const setupMenuButton = (elem: HTMLElement, videoData: VideoData) => {
    let buttonElem;

    if (videoData.type === 'video' || videoData.type === 'mixlist') {
        buttonElem = elem.querySelector<HTMLElement>(
            '.yt-lockup-metadata-view-model-wiz__menu-button',
        );
    }
    else if (videoData.type === 'short') {
        buttonElem = elem.querySelector<HTMLElement>(
            'ytd-menu-renderer',
        );
    }

    if (buttonElem && !buttonElem.hasAttribute('ycr-menu-button')) {
        buttonElem.setAttribute('ycr-menu-button', '');

        buttonElem.addEventListener('click', () => {
            console.log(videoData);

            if (videoData.type === 'video') {
                const listElem = document.querySelector<HTMLElement>(
                    'ytd-popup-container > tp-yt-iron-dropdown yt-list-view-model',
                );
                if (!listElem) return;

                videoBanButtonElem.onclick = e => {
                    pushBan(e);
                    updateChannels();
                };
                videoBanButtonElem.textContent = 'BAN Channel';
                videoBanButtonElem.dataset.ycrQuery = 'pushBanChannel';
                videoBanButtonElem.dataset.ycrId = videoData.channelId;
                videoBanButtonElem.dataset.ycrName = videoData.channelName;
                listElem.appendChild(videoBanButtonElem);
            }
            else if (videoData.type === 'mixlist') {
                const listElem = document.querySelector<HTMLElement>(
                    'ytd-popup-container > tp-yt-iron-dropdown yt-list-view-model',
                );
                if (!listElem) return;

                videoBanButtonElem.onclick = e => {
                    pushBan(e);
                    updateChannels();
                };
                videoBanButtonElem.textContent = 'BAN Mixlist';
                videoBanButtonElem.dataset.ycrQuery = 'pushBanMixlist';
                videoBanButtonElem.dataset.ycrId = videoData.videoId;
                videoBanButtonElem.dataset.ycrTitle = videoData.videoTitle;
                videoBanButtonElem.dataset.ycrName = videoData.channelName;
                listElem.appendChild(videoBanButtonElem);
            }
            else if (videoData.type === 'short') {
                const listElem = document.querySelector<HTMLElement>(
                    'ytd-popup-container > tp-yt-iron-dropdown tp-yt-paper-listbox'
                );
                if (!listElem) return;

                videoBanButtonElem.onclick = e => {
                    pushBan(e);
                    pressEscKey(videoBanButtonElem);
                    updateChannels();
                };
                videoBanButtonElem.textContent = 'BAN Channel';
                videoBanButtonElem.dataset.ycrQuery = 'pushBanChannel';
                videoBanButtonElem.dataset.ycrId = videoData.channelId;
                videoBanButtonElem.dataset.ycrName = videoData.channelName;
                listElem.appendChild(videoBanButtonElem);
            }
        });
    }
};

/**
 * 動画データ取得
 * @param elem
 */
const getVideoData = (elem: HTMLElement): VideoData | undefined => {
    let type: VideoData['type'] | undefined;
    let videoId: VideoData['videoId'] | undefined;
    let videoTitle: VideoData['videoTitle'] | undefined;
    let channelId: VideoData['channelId'] | undefined;
    let channelName: VideoData['channelName'] | undefined;

    const ytVideoElem = elem as HTMLElement & {
        rawProps?: {
            data?: () => Record<string, unknown>;
        };
        data?: Record<string, unknown>;
    };

    let data: Record<string, unknown> | undefined;

    if (ytVideoElem.rawProps && ytVideoElem.rawProps.data) {
        data = ytVideoElem.rawProps.data();
    }
    else if (ytVideoElem.data) {
        data = ytVideoElem.data;
    }

    if (!data || typeof data !== 'object') return;

    if (ytVideoElem.tagName === 'YTD-COMPACT-VIDEO-RENDERER') {
        type = 'short';
    }
    else if (data.contentType === 'LOCKUP_CONTENT_TYPE_VIDEO') {
        type = 'video';
    }
    else if (
        data.contentType === 'LOCKUP_CONTENT_TYPE_PLAYLIST' ||
        data.contentType === 'LOCKUP_CONTENT_TYPE_PODCAST'
    ) {
        type = 'mixlist';
    }

    if (type === 'video') {
        videoId = data.contentId as string;
        [channelId] = JSONPath.JSONPath({
            path: '$..[canonicalBaseUrl,browseId]',
            json: data,
        });
        [channelName] = JSONPath.JSONPath({
            path: '$..metadataParts..text.content',
            json: data,
        });
    }
    else if (type === 'mixlist') {
        videoId = data.contentId as string;
        [videoTitle] = JSONPath.JSONPath({
            path: 'metadata.lockupMetadataViewModel.title.content',
            json: data,
        });
        [channelId] = JSONPath.JSONPath({
            path: '$..[canonicalBaseUrl,browseId]',
            json: data,
        });
        [channelName] = JSONPath.JSONPath({
            path: '$..metadataParts..text.content',
            json: data,
        });
    }
    else if (type === 'short') {
        videoId = data.videoId as string;
        [channelId] = JSONPath.JSONPath({
            path: '$..[canonicalBaseUrl,browseId]',
            json: data,
        });
        [channelName] = JSONPath.JSONPath({
            path: '$..[longBylineText,shortBylineText]..text',
            json: data,
        });
    }

    if (!type || !videoId || !channelName) {
        return;
    }

    if (channelId) {
        channelId = channelId
            ? decodeURI(channelId).replace(/^\//, '')
            : undefined;
    }

    return {
        type,
        videoId,
        videoTitle,
        channelId,
        channelName,
    };
};

/**
 * チャンネルがBAN対象か判定する
 * @param id
 */
const isBanChannel = (id: string | undefined) => {
    return getBanChannels().some(banId => id === banId);
};

/**
 * ミックスリストがBAN対象か判定する
 * @param id
 */
const isBanMixlist = (id: string | undefined) => {
    return getBanMixlists().some(banId => id === banId);
};

/**
 * BAN状況をUIの動画欄に反映する
 */
const updateChannels = () => {
    document
        .querySelectorAll<HTMLElement>('yt-lockup-view-model, ytd-compact-video-renderer')
        .forEach(executeChannel);

    // エンドスクリーンも更新
    updateEndscreen();
};

/**
 * チャンネルorミックスリストをBAN判定して消す
 * @param deleteTargetElem
 */
const executeChannel = (deleteTargetElem: HTMLElement) => {
    const videoData = getVideoData(deleteTargetElem);
    if (!videoData) return;

    // エンドスクリーン用
    videoDataList.push(videoData);

    let reason = undefined;
    if (videoData.type === 'video' && isBanChannel(videoData.channelId)) {
        reason = 'Reason: BAN Channel';
    }
    else if (videoData.type === 'short' && isBanChannel(videoData.channelId)) {
        reason = 'Reason: BAN Channel';
    }
    else if (videoData.type === 'mixlist' && isBanMixlist(videoData.videoId)) {
        reason = 'Reason: BAN Mixlist';
    }

    // BAN理由があれば消す
    if (reason) {
        deleteTargetElem.setAttribute('ycr-banned', `[${SCRIPT_NAME}] Deleted. (${reason})`);
        logger(`Deleted. (${reason})`);
    }

    setupMenuButton(deleteTargetElem, videoData);
};

export const channelsObserver = new MutationObserver(mutationList => {
    const list = mutationList.filter(x =>
        x.target instanceof HTMLElement &&
        x.type === 'childList' && (
            x.target.tagName === 'YT-LOCKUP-VIEW-MODEL' ||
            x.target.tagName === 'YTD-COMPACT-VIDEO-RENDERER'
        ) &&
        !x.target.hasAttribute('ycr-banned')
    );
    if (!list.length) return;

    for (const mutation of list) {
        if (mutation.target instanceof HTMLElement) {
            executeChannel(mutation.target);
        }
    }
});
