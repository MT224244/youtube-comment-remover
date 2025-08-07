import { getBanChannels, videoDataList } from './lib';

/**
 * チャンネルがBAN対象か判定する
 * @param id
 */
const isBanChannel = (id: string | undefined) => {
    return getBanChannels().some(banId => id === banId);
};

/**
 * エンドスクリーンの動画をBAN判定して消す
 * @param deleteTargetElem
 */
const executeEndscreen = (deleteTargetElem: HTMLAnchorElement) => {
    const url = new URL(deleteTargetElem.href);
    const videoId = url.searchParams.get('v');

    const videoData = videoDataList.find(x => x.videoId === videoId);

    if (videoData && isBanChannel(videoData.channelId)) {
        deleteTargetElem.setAttribute('ycr-banned', `[${SCRIPT_NAME}] Deleted.`);
    }
};

/**
 * BAN状況をUIのエンドスクリーンに反映する
 */
export const updateEndscreen = () => {
    document
        .querySelectorAll<HTMLAnchorElement>('.ytp-endscreen-content > a')
        .forEach(executeEndscreen);
};

export const endscreenObserver = new MutationObserver((mutationList) => {
    const list = mutationList.filter(x =>
        x.target instanceof HTMLElement &&
        x.type === 'childList' &&
        x.target.classList.contains('ytp-endscreen-content') &&
        x.addedNodes.length > 0 &&
        x.addedNodes[0] instanceof HTMLAnchorElement &&
        !x.addedNodes[0].hasAttribute('ycr-banned'),
    );
    if (!list.length) return;

    for (const mutation of list) {
        const elem = mutation.addedNodes[0];
        if (elem instanceof HTMLAnchorElement) {
            executeEndscreen(elem);
        }
    }
});
