import { version } from '../package.json';
import type { BanId, BansJson, BanWord } from '@ycr/types';

export const FILE_NAME = 'bans.json';

/**
 * 初期状態のファイル作る
 */
export const createFile = () => {
    const content = {
        ids: [],
        words: [],
    };

    const blob = Utilities.newBlob(JSON.stringify(content), 'application/json', FILE_NAME);

    const file = Drive.Files.create({
        name: FILE_NAME,
        parents: ['appDataFolder'],
    }, blob);

    const fileId = file.id ?? '';
    saveFileId(fileId);
};

/**
 * ファイルの内容取得
 */
export const getFile = (): BansJson => {
    const fileId = getFileId();
    if (!fileId) {
        throw Error('ファイルIDが見つかりません。createFileを実行してください。');
    }

    return JSON.parse(Drive.Files.get(fileId, { alt: 'media' }));
};

/**
 * ファイルのアップデート
 */
export const updateFile = (content: BansJson) => {
    const fileId = getFileId();
    if (!fileId) {
        throw Error('ファイルIDが見つかりません。createFileを実行してください。');
    }

    const blob = Utilities.newBlob(JSON.stringify(content), 'application/json', FILE_NAME);

    Drive.Files.update({}, fileId, blob);
};

// #region for do

export const GET_meta = () => {
    return ContentService.createTextOutput()
        .setMimeType(ContentService.MimeType.JSON)
        .setContent(JSON.stringify({
            version
        }));
};

export const GET_tampermonkey = () => {
    const scriptCode = HtmlService
        .createHtmlOutputFromFile('tampermonkey')
        .getContent()
        .replace('{{BACKEND_URL}}', ScriptApp.getService().getUrl());

    return ContentService.createTextOutput()
        .setMimeType(ContentService.MimeType.JAVASCRIPT)
        .setContent(scriptCode);
};

/**
 * doGet用: ファイルの中身を返す
 */
export const GET_getBans = () => {
    const bans = getFile();

    return ContentService.createTextOutput()
        .setMimeType(ContentService.MimeType.JSON)
        .setContent(JSON.stringify(bans));
};

/**
 * doPost用: ファイルにIDを挿入
 */
export const POST_pushBanId = (data: BanId) => {
    // dataがおかしい
    if (typeof data !== 'object' || !data.id || !data.name) {
        return return400();
    }

    const bans = getFile();

    // 追加しようとしたIDが既にある
    if (bans.ids.some(x => x.id === data.id)) {
        return return409();
    }

    bans.ids.push(data);
    updateFile(bans);

    return ContentService
        .createTextOutput(JSON.stringify(bans))
        .setMimeType(ContentService.MimeType.JSON);
};

/**
 * doPost用: ファイルにWordを挿入
 */
export const POST_pushBanWord = (data: BanWord) => {
    // dataがおかしい
    if (typeof data !== 'object' || !data.word) {
        return return400();
    }

    const bans = getFile();

    // 追加しようとしたWordが既にある
    if (bans.words.some(x => x.word === data.word)) {
        return return409();
    }

    bans.words.push(data);
    updateFile(bans);

    return ContentService
        .createTextOutput(JSON.stringify(bans))
        .setMimeType(ContentService.MimeType.JSON);
};

// #endregion

// #region エラーレスポンス

/**
 * do用: 400エラーを返す
 */
export const return400 = () => {
    return ContentService
        .createTextOutput(JSON.stringify({
            status: 400,
            message: '400 Bad Request',
        }))
        .setMimeType(ContentService.MimeType.JSON);
};

/**
 * do用: 404エラーを返す
 */
export const return404 = () => {
    return ContentService
        .createTextOutput(JSON.stringify({
            status: 404,
            message: '404 Not Found',
        }))
        .setMimeType(ContentService.MimeType.JSON);
};

/**
 * do用: 409エラーを返す
 */
export const return409 = () => {
    return ContentService
        .createTextOutput(JSON.stringify({
            status: 409,
            message: '409 Conflict',
        }))
        .setMimeType(ContentService.MimeType.JSON);
};

// #endregion

// #region ユーザープロパティ

/**
 * ユーザープロパティにファイルIDを格納
 */
export const saveFileId = (fileId: string) => {
    const userPropsService = PropertiesService.getUserProperties();

    userPropsService.setProperty('FILE_ID', fileId);
    Logger.log(`fileId saved: ${fileId}`);
};

/**
 * ユーザープロパティからファイルIDを取得
 */
export const getFileId = () => {
    const userPropsService = PropertiesService.getUserProperties()
    const fileId = userPropsService.getProperty('FILE_ID');
    Logger.log(`FileId: ${fileId}`);

    return fileId;
};

// #endregion
