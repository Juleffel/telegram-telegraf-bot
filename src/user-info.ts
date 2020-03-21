import Timeout = NodeJS.Timeout;
import {
    Answer,
    EffectType,
    Reply,
    ReplyEffect,
    ReplyEffectDeleteData,
    ReplyEffectSetData,
    ReplyEffectSetReturnId,
    ReplyEffectUpdateData,
    ReplyEffectUpdateDataAsync
} from "./replies";
import * as objectPath from "object-path";
import {catchError, map, mergeMap} from "rxjs/operators";
import {forkJoin, Observable, of} from "rxjs";

export type RuntimeData = {[key: string]: any};
export interface UserInfo {
    lastMessage: string;
    lastMessageDate: Date;
    messagesCount: number;
    lastReply: Reply;
    lastReplyDate: Date;
    repliesCount: number;
    interval?: Timeout;
    timeout?: Timeout;
    runtimeData: RuntimeData;
    returnId: string;
}
export const initUserInfo: UserInfo = {
    lastMessage: null,
    lastMessageDate: null,
    messagesCount: 0,
    lastReply: null,
    lastReplyDate: null,
    repliesCount: 0,
    interval: null,
    timeout: null,
    runtimeData: {},
    returnId: null,
};


/************************
 * Apply effects
 ***********************/

export const applySetEffect = (effect: ReplyEffectSetData, message: string, userInfo: UserInfo): UserInfo => {
    const newUserInfo = JSON.parse(JSON.stringify(userInfo));
    for (const path of Object.keys(effect.updates)) {
        objectPath.set(
            newUserInfo,
            path,
            effect.updates[path],
        );
    }
    return newUserInfo;
};

export const applyUpdateEffect = (effect: ReplyEffectUpdateData, message: string, userInfo: UserInfo): UserInfo => {
    const newUserInfo = JSON.parse(JSON.stringify(userInfo));
    for (const path of Object.keys(effect.updates)) {
        const fn = effect.updates[path];
        const oldData = objectPath.get(
            userInfo,
            path,
        );
        objectPath.set(
            newUserInfo,
            path,
            fn(userInfo, message, oldData),
        );
    }
    return newUserInfo;
};

export const applyUpdateEffectAsync = (effect: ReplyEffectUpdateDataAsync, message: string, userInfo: UserInfo): Observable<UserInfo> => {
    return forkJoin(Object.keys(effect.updates).map((path) => {
        const fn = effect.updates[path];
        const oldData = objectPath.get(
            userInfo,
            path,
        );
        return fn(userInfo, message, oldData).pipe(
            map((res) => ([path, res])),
        );
    })).pipe(
        map((updates: [string, any][]) => {
            const newUserInfo = JSON.parse(JSON.stringify(userInfo));
            for (const update of updates) {
                const [path, res] = update;
                objectPath.set(
                    newUserInfo,
                    path,
                    res,
                );
            }
            return newUserInfo;
        }),
        catchError((err) => {
            console.error('Error while applying async effect:', err);
            return of(userInfo);
        }),
    );
};

export const applyDeleteEffect = (effect: ReplyEffectDeleteData, userInfo: UserInfo): UserInfo => {
    const newUserInfo = JSON.parse(JSON.stringify(userInfo));
    for (const path of effect.deletes) {
        objectPath.del(newUserInfo, path);
    }
    return newUserInfo;
};


export const applySetReturnId = (effect: ReplyEffectSetReturnId, userInfo: UserInfo): UserInfo => {
    const newUserInfo: UserInfo = JSON.parse(JSON.stringify(userInfo));
    newUserInfo.returnId = effect.returnId;
    return newUserInfo;
};

export const applyEffect = (reply: Reply, effect: ReplyEffect, message: string, userInfo: UserInfo): Observable<UserInfo> => {
    switch (effect.type) {
        case EffectType.SetData:
            return of(applySetEffect(effect, message, userInfo));
        case EffectType.UpdateData:
            return of(applyUpdateEffect(effect, message, userInfo));
        case EffectType.UpdateDataAsync:
            return applyUpdateEffectAsync(effect, message, userInfo);
        case EffectType.DeleteData:
            return of(applyDeleteEffect(effect, userInfo));
        case EffectType.SetReturnId:
            return of(applySetReturnId(effect, userInfo));
        default:
            return of(userInfo);
    }
};

export const applyEffects = (reply: Reply, answer: Answer, message: string, userInfo: UserInfo): Observable<UserInfo> => {
    if (reply && answer && answer.effects && userInfo) {
        let newUserInfoObs = of(JSON.parse(JSON.stringify(userInfo)));
        for (const effect of answer.effects) {
            newUserInfoObs = newUserInfoObs.pipe(
                mergeMap(_userInfo => applyEffect(reply, effect, message, _userInfo)),
            );
        }
        return newUserInfoObs;
    }
    return of(null);
};

/********
 * Utils
 ********/

export const replaceVarsInMessage = (message: string, runtimeData: RuntimeData): string => {
    if (!message) { return null; }
    const vars = message.match(/\{\{[^\}]+\}\}/g);
    if (!vars || vars.length === 0 || !runtimeData) { return message; }

    let ret = message;
    for (const v of vars) {
        const path = v.replace('{{', '').replace('}}', '');
        ret = ret.replace(v, objectPath.get(runtimeData, path, '--'));
    }
    return ret;
};
