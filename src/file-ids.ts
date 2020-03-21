import {Observable, of} from "rxjs";
import {readAsJson, writeAsJson} from "./json-fs";

export type FileIdsDataCache = {[id: string]: string};
let fileIds: FileIdsDataCache = {};
const fileIdsDataPath = 'data/file-ids.json';


export const persistFileIds = (): Observable<boolean> => {
    return writeAsJson(fileIdsDataPath, fileIds);
};

export const loadFileIds = () => {
    readAsJson<FileIdsDataCache>(fileIdsDataPath).subscribe(_fileIds => {
        fileIds = _fileIds || {};
        console.log('Loaded file ids:');
        console.log(_fileIds);
    });
};

// If persist, save data.
// If persist & persistAsync: Persist data without caring about when or if it will be saved, return immediately (default)
export const persistFileIdsIf = (persist: boolean, persistAsync: boolean): Observable<boolean> => {
    if (persist) {
        if (persistAsync) {
            persistFileIds().subscribe();
            return of(true);
        } else {
            return persistFileIds();
        }
    } else {
        return of(true);
    }
};

export const setFileId = (urlOrPath: string, fileId: string, persist = true, persistAsync = true): Observable<boolean> => {
    fileIds[urlOrPath] = fileId;
    return persistFileIdsIf(persist, persistAsync);
};

export const getFileId = (urlOrPath: string): Observable<string> => {
    return of(fileIds[urlOrPath]);
};
