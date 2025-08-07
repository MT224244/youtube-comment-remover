declare global {
    var manual_getFileList: () => void;
    var manual_getFile: () => void;
    var manual_removeFile: () => void;
    var manual_anyRemoveFile: () => void;
    var manual_forTest: () => void;

    var doGet: (e: GoogleAppsScript.Events.DoGet) => GoogleAppsScript.Content.TextOutput;
    var doPost: (e: GoogleAppsScript.Events.DoPost) => GoogleAppsScript.Content.TextOutput;
}

export { };
