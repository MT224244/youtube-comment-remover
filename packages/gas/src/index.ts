import {
    GET_getBans,
    GET_meta,
    GET_tampermonkey,
    getFile,
    getFileId,
    POST_pushBanId,
    POST_pushBanWord,
    return404,
} from './lib';

// #region 手動実行用

/**
 * appDataFolder内のファイルリスト確認用
 */
global.manual_getFileList = () => {
    const { files } = Drive.Files.list({
        spaces: 'appDataFolder',
        q: `'appDataFolder' in parents`,
    });

    Logger.log(files);
};

/**
 * ファイルの中身確認用
 */
global.manual_getFile = () => {
    const file = getFile();

    Logger.log(file);
};

/**
 * ファイル手動削除用
 */
global.manual_removeFile = () => {
    const fileId = getFileId();
    if (!fileId) {
        throw Error('ファイルIDが見つかりません。');
    }

    Drive.Files.remove(fileId);
};

/**
 * ミスってファイル作った時とか用
 */
global.manual_anyRemoveFile = () => {
    const FILE_ID = '';

    Drive.Files.remove(FILE_ID);
};

/**
 * 動作確認用
 */
global.manual_forTest = () => {
};

// #endregion

// #region do

global.doGet = ({ parameters }) => {
    const [q] = parameters.q ?? [undefined];

    if (q === 'meta') {
        return GET_meta();
    }
    if (q === 'tampermonkey') {
        return GET_tampermonkey();
    }
    else if (q === 'getBans') {
        return GET_getBans();
    }
    else {
        return return404();
    }
};

global.doPost = ({ parameters, postData }) => {
    const [q] = parameters.q ?? [undefined];

    if (q === 'pushBanId') {
        const data = JSON.parse(postData.getDataAsString());
        return POST_pushBanId(data);
    }
    else if (q === 'pushBanWord') {
        const data = JSON.parse(postData.getDataAsString());
        return POST_pushBanWord(data);
    }
    else {
        return return404();
    }
};

// #endregion
