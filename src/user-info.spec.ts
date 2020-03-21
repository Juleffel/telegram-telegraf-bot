import {
    applyDeleteEffect,
    applyEffects,
    applySetEffect,
    applyUpdateEffect, applyUpdateEffectAsync,
    initUserInfo, replaceVarsInMessage, RuntimeData,
} from "./user-info";
import {
    Answer,
    EffectType,
    Reply,
    ReplyEffectDeleteData,
    ReplyEffectSetData,
    ReplyEffectUpdateData, ReplyEffectUpdateDataAsync
} from "./replies";
import {tap} from "rxjs/operators";
import {of} from "rxjs";

test('applySetEffect', () => {
    const effect1: ReplyEffectSetData = {
        type: EffectType.SetData,
        updates: {
            hello: 'World',
        }
    };
    expect(
        applySetEffect(effect1, 'hello', initUserInfo)
    ).toEqual(
        {
            ...initUserInfo,
            hello: 'World',
        }
    );
});

test('applyUpdateEffect', () => {
    const effect1: ReplyEffectUpdateData = {
        type: EffectType.UpdateData,
        updates: {
            hello: () => 'World',
        }
    };
    expect(
        applyUpdateEffect(effect1, 'hello', initUserInfo)
    ).toEqual(
        {
            ...initUserInfo,
            hello: 'World',
        }
    );
    expect((initUserInfo as any).hello).toBeUndefined();

    const effect2: ReplyEffectUpdateData = {
        type: EffectType.UpdateData,
        updates: {
            hello: (userInfo, message) => (message),
            undefined: (userInfo) => (userInfo as any).hello,
            messagesCount: ((userInfo, message, oldData) => oldData + 1),
            "runtimeData.obj": ((userInfo) => ({zero: userInfo.messagesCount})),
        }
    };
    expect(
        applyUpdateEffect(effect2, 'world!', initUserInfo)
    ).toEqual(
        {
            ...initUserInfo,
            hello: 'world!',
            undefined: undefined,
            messagesCount: 1,
            runtimeData: {
                obj: {
                    zero: 0
                }
            }
        }
    );
});

describe('applyUpdateEffectAsync', () => {

    test('applyUpdateEffectAsync effect1', () => {
        const effect1: ReplyEffectUpdateDataAsync = {
            type: EffectType.UpdateDataAsync,
            updates: {
                hello: () => of('World'),
            }
        };
        return applyUpdateEffectAsync(effect1, 'hello', initUserInfo).pipe(
            tap((_userInfo) => {
                expect(_userInfo).toEqual({
                    ...initUserInfo,
                    hello: 'World',
                });
            })
        ).toPromise();
    });

    test('applyUpdateEffectAsync effect2', () => {

        const effect2: ReplyEffectUpdateDataAsync = {
            type: EffectType.UpdateDataAsync,
            updates: {
                hello: (userInfo, message) => of(message),
                undefined: (userInfo) => of((userInfo as any).hello),
                messagesCount: ((userInfo, message, oldData) => of(oldData + 1)),
                "runtimeData.obj": ((userInfo) => of({zero: userInfo.messagesCount})),
            }
        };
        return applyUpdateEffectAsync(effect2, 'world!', initUserInfo).pipe(
            tap((_userInfo) => {
                expect(_userInfo).toEqual({
                    ...initUserInfo,
                    hello: 'world!',
                    undefined: undefined,
                    messagesCount: 1,
                    runtimeData: {
                        obj: {
                            zero: 0
                        }
                    }
                });
            })
        ).toPromise();
    });

});

test('applyDeleteEffect', () => {
    const effect1: ReplyEffectDeleteData = {
        type: EffectType.DeleteData,
        deletes: ['messagesCount', 'repliesCount'],
    };
    const newUserInfo = applyDeleteEffect(effect1, initUserInfo);
    expect(newUserInfo.lastReply).toBeNull();
    expect(newUserInfo.repliesCount).toBeUndefined();
});

describe('applyEffects', () => {
    const answer1: Answer = {
        nextId: 'test-2',
        conditions: [],
    };
    const answer2: Answer = {
        nextId: 'test-3',
        conditions: [],
        effects: [{
            type: EffectType.SetData,
            updates: {
                "runtimeData.hello": 'world',
                "runtimeData.deleted": 'deleted',
            }
        },{
            type: EffectType.DeleteData,
            deletes: ['runtimeData.deleted'],
        },],
    };
    const reply: Reply = {
        id: 'test',
        message: 'Test',
        answers: [answer1, answer2],
    };

    test('applyEffects 1', () => {
        return applyEffects(reply, answer1, 'hello', initUserInfo).pipe(
            tap(v => expect(v).toBeNull()),
        ).toPromise();
    });

    test('applyEffects 2', () => {
        return applyEffects(reply, answer2, 'hello', initUserInfo).pipe(
            tap(_userInfo => {
                expect(_userInfo.runtimeData.hello).toEqual('world');
                expect(_userInfo.runtimeData.deleted).toBeUndefined();
            }),
        ).toPromise();
    });
});

test('replaceVarsInMessage', () => {
    const runtimeData: RuntimeData = {
        hello: 'world',
        obj: {
            num: 4,
        },
    };
    expect(replaceVarsInMessage('Hello {{hello}}! {{obj.num}} times!', runtimeData)).toEqual(
        'Hello world! 4 times!'
    );
    expect(replaceVarsInMessage('Hello world!', {})).toEqual(
        'Hello world!'
    );
    expect(replaceVarsInMessage('Hello {{world}}!', {})).toEqual(
        'Hello --!'
    );
});
