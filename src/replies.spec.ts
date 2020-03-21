import {
    Answer, MessageType, Reply,
    AnswerConditionType,
    getReplyById,
    hearWord,
    hearWords,
    matchAnswers,
    matchCondition,
    matchConditionHear,
    matchConditionRegexp,
    matchConditions,
    matchConditionSpeak,
    matchConditionWait,
    searchStr,
    splitStringInWords,
    replyWaitTime,
    getReply, calculateNextId, getReplyByNextId,
} from "./replies";
import {sub} from 'date-fns';
import {initUserInfo, UserInfo} from "./user-info";

const wordsHello = ['hi', 'hello'];
const exampleBotDataset: Reply[] = [
    {
        id: 'init',
        type: MessageType.Text,
        message: 'Hello dude!',
        answers: [
            {
                nextId: 'init-2',
                conditions: [
                    {
                        type: AnswerConditionType.Hear,
                        words: wordsHello,
                    }
                ],
            }
        ]
    },
    {
        id: 'init-2',
        type: MessageType.Text,
        message: 'Good.',
    },
];

describe('Replies functions', () => {
    test('splitStringInWords', () => {
        expect(splitStringInWords('Hello dude!')).toStrictEqual(['hello', 'dude', '!']);
        expect(splitStringInWords('Hello dude?!Plop')).toStrictEqual(['hello', 'dude', '?!', 'plop']);
        expect(splitStringInWords("Bonjour M. Bond\nComment ça\rva?     \\o/ c'est l'été sur l'île de PÂQUE. ;'=)")).toStrictEqual(
            ['bonjour', 'm', '.', 'bond', 'comment', 'ça', 'va', '?', '\\', 'o', '/',
                'c', '\'', 'est', 'l', '\'', 'été', 'sur', 'l', '\'', 'île', 'de', 'pâque', '.', ';\'=)']);
        expect(splitStringInWords('')).toStrictEqual([]);
    });
    test('searchStr', () => {
        expect(searchStr('Hello dude!')).toStrictEqual(' hello  dude  ! ');
        expect(searchStr('Hello dude?!Plop')).toStrictEqual(' hello  dude  ?!  plop ');
        expect(searchStr('')).toStrictEqual('');
    });

    test('hearWord', () => {
        expect(hearWord('Hello dude!', 'hello')).toBeTruthy();
        expect(hearWord('Hello dude!', 'hi')).toBeFalsy();
        expect(hearWord('Hello dude!', '')).toBeFalsy();
        expect(hearWord('Hello dude!', 'hello Dude')).toBeTruthy();
        expect(hearWord('Hello dude!', '!')).toBeTruthy();
        expect(hearWord('Hello dude!', 'dude!')).toBeTruthy();
        expect(hearWord('Hello dude!', 'DUDE !')).toBeTruthy();
        expect(hearWord('Shit dude!', 'hi')).toBeFalsy();
        expect(hearWord("I don't want to", "i don't")).toBeTruthy();
    });

    test('hearWords', () => {
        expect(hearWords('Hello dude!', ['hello'])).toBeTruthy();
        expect(hearWords('Hello dude how are you?', ['hi', 'shit', 'hello'])).toBeTruthy();
        expect(hearWords('Hello dude how are you?', ['hi', 'shit'])).toBeFalsy();
        expect(hearWords('Hello dude how are you?', [])).toBeFalsy();
    });

    test('matchConditionHear', () => {
        expect(matchConditionHear('hello dude!', {
            type: AnswerConditionType.Hear,
            words: ['hi', 'hello'],
        })).toBeTruthy();
        expect(matchConditionHear('hello dude!', {
            type: AnswerConditionType.Hear,
            words: ['no', 'nope'],
        })).toBeFalsy();
    });

    test('matchConditionRegexp', () => {
        expect(matchConditionRegexp('Hello dude!', {
            type: AnswerConditionType.MatchRegex,
            regex: /hello/i,
        })).toBeTruthy();
    });

    test('matchConditionWait', () => {
        const userInfo = initUserInfo;
        userInfo.lastReplyDate = sub(Date.now(), {seconds: 90});
        expect(matchConditionWait('hello dude!', {
            type: AnswerConditionType.Wait,
            seconds: 60,
        }, userInfo)).toBeTruthy();
        expect(matchConditionWait(null, {
            type: AnswerConditionType.Wait,
            minutes: 1,
            seconds: 15,
        }, userInfo)).toBeTruthy();
        expect(matchConditionWait(null, {
            type: AnswerConditionType.Wait,
            minutes: 2,
        }, userInfo)).toBeFalsy();
    });

    test('matchConditionSpeak', () => {
        expect(matchConditionSpeak('Hello dude!', {
            type: AnswerConditionType.Speak,
        })).toBeTruthy();
        expect(matchConditionSpeak('', {
            type: AnswerConditionType.Speak,
        })).toBeFalsy();
    });

    test('matchCondition', () => {
        expect(matchCondition({
            type: AnswerConditionType.Hear,
            words: ['hi', 'hello'],
        }, 'hello dude!', null)).toBeTruthy();
        expect(matchCondition({
            type: AnswerConditionType.MatchRegex,
            regex: /hello/i,
        }, 'Hello dude!', null)).toBeTruthy();
    });

    test('matchConditions', () => {
        expect(matchConditions([{
            type: AnswerConditionType.Hear,
            words: ['hi', 'hello'],
        }, {
            type: AnswerConditionType.Hear,
            words: ['dude', 'boy'],
        }], 'hello dude!', null)).toBeTruthy();

        expect(matchConditions([{
            type: AnswerConditionType.Hear,
            words: ['hi', 'hello'],
        }, {
            type: AnswerConditionType.Hear,
            words: ['girl', 'miss'],
        }], 'hello dude!', null)).toBeFalsy();
    });

    test('matchAnswers', () => {
        const answers: Answer[] = [
            {
                nextId: 'init-3-yes',
                conditions: [
                    {
                        type: AnswerConditionType.Hear,
                        words: ['yes', 'yep'],
                    }
                ],
            },
            {
                nextId: 'init-3-no',
                conditions: [
                    {
                        type: AnswerConditionType.Hear,
                        words: ['no', 'nope'],
                    }
                ],
            },
            {
                nextId: 'init-3-else',
                conditions: [{
                    type: AnswerConditionType.Speak,
                }]
            },
        ];
        expect(matchAnswers(answers, 'hello dude!', null).nextId).toEqual('init-3-else');
        expect(matchAnswers(answers, 'Hell yes I do :)', null).nextId).toEqual('init-3-yes');
        expect(matchAnswers(answers, 'I wanna say no but I will say yes...', null).nextId).toEqual('init-3-yes');
        expect(matchAnswers(answers, 'I wanna say yes but I will say no...', null).nextId).toEqual('init-3-yes');
        expect(matchAnswers(answers, 'NO', null).nextId).toEqual('init-3-no');
    });

    test('matchAnswer with wait', () => {
        const userInfo: UserInfo = {
            "lastMessage": null,
            "lastMessageDate": null,
            "messagesCount": 0,
            "lastReply": {
                "id": "init",
                "type": 0,
                "message": "Hello dude!",
                "answers": [
                    {
                        "nextId": "init-2",
                        "conditions": [
                            {
                                "type": 1,
                                "words": [
                                    "hi",
                                    "hello"
                                ]
                            }
                        ]
                    },
                    {
                        "nextId": "init-1-waiting",
                        "conditions": [
                            {
                                "type": 2,
                                "seconds": 30
                            }
                        ]
                    }
                ]
            },
            "lastReplyDate": new Date("2020-01-24T18:55:03.956Z"),
            "repliesCount": 1,
            "runtimeData": {},
            "returnId": '',
        };
        expect(matchAnswers(userInfo.lastReply.answers, null, userInfo).nextId).toEqual('init-1-waiting');
    });

    test('getReplyById', () => {
        expect(getReplyById(exampleBotDataset, 'init').id).toEqual('init');
        expect(getReplyById(exampleBotDataset, 'init-2').id).toEqual('init-2');
        expect(getReplyById(exampleBotDataset, '???')).toBeNull();
    });

    test('calculateNextId', () => {
        const replies = [
            {
                id: 'hello',
                message: 'Hello.',
            },
            {
                id: 'message',
                message: 'Message.',
            },
        ];
        const userInfo: UserInfo = {
            ...initUserInfo,
            "runtimeData": {
                nextId: 'hello',
            },
        };
        expect(calculateNextId(userInfo, 'message', 'hello')).toEqual('hello');
        expect(calculateNextId(userInfo, 'message', (userInfo) => userInfo.runtimeData.nextId)).toEqual('hello');
        expect(calculateNextId(userInfo, 'message', (userInfo, message) => message)).toEqual('message');
    });

    test('calculateNextId', () => {
        const replies = [
            {
                id: 'hello',
                message: 'Hello.',
            },
            {
                id: 'message',
                message: 'Message.',
            },
        ];
        const userInfo: UserInfo = {
            ...initUserInfo,
            "runtimeData": {
                nextId: 'hello',
            },
        };
        expect(getReplyByNextId(replies, userInfo, 'message', 'hello')).toEqual(replies[0]);
        expect(getReplyByNextId(replies, userInfo, 'message', (userInfo) => userInfo.runtimeData.nextId)).toEqual(replies[0]);
        expect(getReplyByNextId(replies, userInfo, 'message', (userInfo, message) => message)).toEqual(replies[1]);
    });

    test('replyWaitTime', () => {
        const testReply0: Reply = {
            id: 'init',
            type: MessageType.Text,
            message: 'Hello dude!',
        };
        expect(replyWaitTime(testReply0)).toBe(0);
        const testReply1: Reply = {
            id: 'init',
            type: MessageType.Text,
            message: 'Hello dude!',
            answers: [{
                nextId: 'init-2',
                conditions: [{
                    type: AnswerConditionType.Hear,
                    words: wordsHello,
                }],
            }, {
                nextId: 'init-1-waiting',
                conditions: [{
                    type: AnswerConditionType.Wait,
                    seconds: 30,
                }],
            }],
        };
        expect(replyWaitTime(testReply1)).toBe(30);
        const testReply2: Reply = {
            id: 'init',
            type: MessageType.Text,
            message: 'Hello dude!',
            answers: [{
                nextId: 'init-2',
                conditions: [{
                    type: AnswerConditionType.Hear,
                    words: wordsHello,
                }],
            }],
        };
        expect(replyWaitTime(testReply2)).toBe(0);
        const testReply3: Reply = {
            id: 'init',
            type: MessageType.Text,
            message: 'Hello dude!',
            answers: [{
                nextId: 'init-2',
                conditions: [{
                    type: AnswerConditionType.Hear,
                    words: wordsHello,
                }],
            }, {
                nextId: 'init-1-waiting',
                conditions: [{
                    type: AnswerConditionType.Wait,
                    seconds: 30,
                }, {
                    type: AnswerConditionType.Speak,
                }],
            }],
        };
        expect(replyWaitTime(testReply3)).toBe(0);
    });

    test('getReply', () => {
        expect(getReply(exampleBotDataset, initUserInfo, null).reply).toBeUndefined();
        expect(getReply(exampleBotDataset, {
            ...initUserInfo,
            lastReply: getReplyById(exampleBotDataset, 'init'),
            lastReplyDate: new Date(),
            repliesCount: 1,
        }, null).reply).toBeUndefined();
        expect(getReply(exampleBotDataset, {
            ...initUserInfo,
            lastReply: getReplyById(exampleBotDataset, 'init'),
            lastReplyDate: new Date(),
            repliesCount: 1,
        }, 'bof').reply).toBeUndefined();
        expect(getReply(exampleBotDataset, {
            ...initUserInfo,
            lastReply: getReplyById(exampleBotDataset, 'init'),
            lastReplyDate: new Date(),
            repliesCount: 1,
        }, 'Hello!').reply).toEqual(
            getReplyById(exampleBotDataset, 'init-2')
        );
        const countdownDataset: Reply[] = [
            {
                id: 'start-1',
                type: MessageType.Countdown,
                message: "Start the countdown",
                seconds: 10,
                nextId: 'end',
            },
            {
                id: 'start-2',
                type: MessageType.Countdown,
                message: "Start the countdown",
                seconds: 10,
                countEvery: 2,
                nextId: 'end',
            },
            {
                id: 'end',
                message: "End the countdown"
            },
        ];
        expect(getReply(exampleBotDataset, {
            ...initUserInfo,
            lastReply: getReplyById(countdownDataset, 'start-1'),
            lastReplyDate: sub(new Date(), {seconds: 6}),
        }, null).reply).toBeNull();
        expect(getReply(exampleBotDataset, {
            ...initUserInfo,
            lastReply: getReplyById(countdownDataset, 'start-1'),
            lastReplyDate: sub(new Date(), {seconds: 12}),
        }, null).reply).toBe(
            getReplyById(exampleBotDataset, 'end')
        );
        expect(getReply(exampleBotDataset, {
            ...initUserInfo,
            lastReply: getReplyById(countdownDataset, 'start-2'),
            lastReplyDate: sub(new Date(), {seconds: 6.2}),
        }, null, true).reply).toEqual(
            {
                id: 'countdown-4',
                type: MessageType.Count,
                message: '4s...',
            }
        );
        expect(getReply(exampleBotDataset, {
            ...initUserInfo,
            lastReply: getReplyById(countdownDataset, 'start-2'),
            lastReplyDate: sub(new Date(), {seconds: 12}),
        }, null).reply).toBe(
            getReplyById(exampleBotDataset, 'end')
        );
    });

});

