import {ContextMessageUpdate} from "telegraf";
import {Observable, of} from "rxjs";
import * as objectPath from "object-path";

import {initUserInfo, UserInfo} from "./user-info";
import {readAsJson, writeAsJson} from "./json-fs";

export interface UserData {
    id: string;
    username: string;
    info: UserInfo,
    ctx?: ContextMessageUpdate,
}
export type UsersDataCache = {[id: string]: UserData};
let usersData: UsersDataCache = {};
const usersDataFilePath = 'data/users-data.json';

export const persistData = (): Observable<boolean> => {
    const dataClean: UsersDataCache = {};
    for (const id of Object.keys(usersData)) {
        dataClean[id] = {
            ...usersData[id],
            info: {...usersData[id].info},
        };
        delete dataClean[id].ctx;
        delete dataClean[id].info.interval;
        delete dataClean[id].info.timeout;
    }
    return writeAsJson(usersDataFilePath, dataClean);
};
// If persist, save data.
// If persist & persistAsync: Persist data without caring about when or if it will be saved, return immediately (default)
export const persistDataIf = (persist: boolean, persistAsync: boolean): Observable<boolean> => {
    if (persist) {
        if (persistAsync) {
            persistData().subscribe();
            return of(true);
        } else {
            return persistData();
        }
    } else {
        return of(true);
    }
};
export const loadData = () => {
    readAsJson<UsersDataCache>(usersDataFilePath).subscribe(_usersData => {
        usersData = _usersData || {};
        console.log('Loaded data:');
        console.log(usersData);
    });
};

export const getUserId = (ctx: ContextMessageUpdate): string => {
    return ctx.from.username;
};
export const getData = (userId: string): Observable<UserData> => {
    return of(usersData[userId]);
};
export const getDataCtx = (ctx: ContextMessageUpdate): Observable<UserData> => {
    return getData(getUserId(ctx));
};
export const getAllData = (): Observable<UserData[]> => {
    return of(Object.values(usersData));
};
export const setData = (userId: string, userData: UserData, persist = true, persistAsync = true): Observable<boolean> => {
    usersData[userId] = userData;
    return persistDataIf(persist, persistAsync);
};
export const setDataCtx = (ctx: ContextMessageUpdate, userData: UserData): Observable<boolean> => {
    return setData(getUserId(ctx), userData);
};
export const initDataCtx = (ctx: ContextMessageUpdate): Observable<boolean> => {
    return setDataCtx(ctx, {
        ctx,
        id: getUserId(ctx),
        username: ctx.from.username,
        info: initUserInfo,
    });
};
export const updateData = <T>(userId: string, path: string[], fn: (v: T) => T, persist = true, persistAsync = true): Observable<boolean> => {
    const fullPath: any[] = [userId, ...path];
    objectPath.set(
        usersData,
        fullPath,
        fn(objectPath.get(usersData, fullPath)),
    );
    return persistDataIf(persist, persistAsync);
};
export const updateDataCtx = <T>(ctx: ContextMessageUpdate, path: string[], fn: (v: T) => T): Observable<boolean> => {
    return updateData(getUserId(ctx), path, fn);
};
