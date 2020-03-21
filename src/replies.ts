import {applyEffects, RuntimeData, UserInfo} from "./user-info";
import {differenceInCalendarDays, differenceInSeconds, getDay, getHours, sub} from "date-fns";
import {Observable} from "rxjs";

/***********
 * DATA INTERFACES
 ************/
export enum AnswerConditionType {
    MatchRegex,
    Hear,
    Wait,
    WaitHour,
    WeekDays,
    Speak,
    CondFn,
}

// Hear any of the words in the array
export interface AnswerConditionHear {
    type: AnswerConditionType.Hear;
    words: string[];
}
// last message of user matches regex
export interface AnswerConditionRegexp {
    type: AnswerConditionType.MatchRegex;
    regex: RegExp;
}
// wait <seconds>
export interface AnswerConditionWait {
    type: AnswerConditionType.Wait;
    seconds?: number;
    minutes?: number;
}
// wait at least one day, after a certain hour
export interface AnswerConditionWaitHour {
    type: AnswerConditionType.WaitHour;
    hour: number;
}
// Match if today is in days:
// - 0: Monday,
// - 1: Tuesday ...
export interface AnswerConditionWeekDays {
    type: AnswerConditionType.WeekDays;
    days: number[];
}
// Match if user tells anything
export interface AnswerConditionSpeak {
    type: AnswerConditionType.Speak;
}
// Match if user tells anything
export interface AnswerConditionCondFn {
    type: AnswerConditionType.CondFn;
    fn: (runtimeData: RuntimeData, message: string, userInfo: UserInfo) => boolean;
}

export type AnswerCondition =
    | AnswerConditionHear
    | AnswerConditionRegexp
    | AnswerConditionWait
    | AnswerConditionWaitHour
    | AnswerConditionWeekDays
    | AnswerConditionSpeak
    | AnswerConditionCondFn;

export enum EffectType {
    SetData,
    UpdateData,
    UpdateDataAsync,
    DeleteData,
    SetReturnId,
}

export type EffectUpdateDataFn = (userInfo: UserInfo, message: string, oldData: any) => any;
export type EffectUpdateDataAsyncFn = (userInfo: UserInfo, message: string, oldData: any) => Observable<any>;

export interface ReplyEffectSetData {
    type: EffectType.SetData;
    updates: {[path: string]: string | number | object | boolean}
}

export interface ReplyEffectUpdateData {
    type: EffectType.UpdateData;
    updates: {[path: string]: EffectUpdateDataFn}
}

export interface ReplyEffectUpdateDataAsync {
    type: EffectType.UpdateDataAsync;
    updates: {[path: string]: EffectUpdateDataAsyncFn}
}

export interface ReplyEffectDeleteData {
    type: EffectType.DeleteData;
    deletes: string[];
}

export interface ReplyEffectSetReturnId {
    type: EffectType.SetReturnId;
    returnId: string;
}

export type ReplyEffect =
    | ReplyEffectSetData
    | ReplyEffectUpdateData
    | ReplyEffectUpdateDataAsync
    | ReplyEffectDeleteData
    | ReplyEffectSetReturnId;

export const ReturnId = '$returnId';
export type NextIdTypeFn = (userInfo: UserInfo, message: string) => string;
export type NextIdType =
    | string
    | NextIdTypeFn;

/***********
 * example is a example of input matching the condition, displayed to the user as a button to speak
 * conditions && nextId are applied on old version of userInfo
 * effects are run after getting a response
 */
export interface Answer {
    nextId: NextIdType,
    example?: string,
    conditions?: AnswerCondition[];
    effects?: ReplyEffect[];
}

export enum MessageType {
    Text,
    Poll,
    Countdown, Count,
    Logic,
    ImageUrl,
    ImagePath,
}

export interface PollOption {
    text: string;
}

export interface ReplyText {
    id: string;
    type?: MessageType.Text;
    message: string;
    replyOptions?: string[];
    answers?: Answer[];
    markdown?: boolean;
}

export interface ReplyPoll {
    id: string;
    type: MessageType.Poll;
    pollOptions: PollOption[];
    message: string;
    answers?: Answer[];
}

export interface ReplyLogic {
    id: string;
    type: MessageType.Logic;
    answers?: Answer[];
}

export interface ReplyImageUrl {
    id: string;
    type: MessageType.ImageUrl;
    url: string;
    caption?: string;
    answers?: Answer[];
}

export interface ReplyImagePath {
    id: string;
    type: MessageType.ImagePath;
    path: string;
    caption?: string;
    answers?: Answer[];
}

// ReplyCountdown are preferable for small time countdown,
// while Answer.Wait can be used for more complex conditionning,
// at a much larger scale of time (hours instead of minutes)
export interface ReplyCountdown {
    id: string;
    type?: MessageType.Countdown;
    message: string;
    replyOptions?: string[];
    seconds: number,
    countEvery?: number,
    nextId: NextIdType,
    answers?: Answer[];
    markdown?: boolean;
}

export interface ReplyCount {
    id: string;
    type?: MessageType.Count;
    message: string;
    answers?: Answer[];
}

export type Reply =
    | ReplyText
    | ReplyCountdown
    | ReplyCount
    | ReplyPoll
    | ReplyLogic
    | ReplyImageUrl
    | ReplyImagePath;

/**********
 * Data helpers
 */
export const getReplyOptions = (reply: ReplyText | ReplyCountdown): string[] => {
    if (!reply) { return null; }
    if (reply.replyOptions) { return reply.replyOptions; }
    if (reply.answers) {
        return reply.answers.map(answer => answer.example).filter(a => !!a);
    }
    return null;
};

export const replyWaitTime = (reply: Reply): number => {
    if (!reply || !reply.answers) { return 0; }
    if (reply.type === MessageType.Countdown) { return reply.seconds; }
    for (const answer of reply.answers) {
        if (answer.conditions && answer.conditions.length === 1 && answer.conditions[0].type === AnswerConditionType.Wait) {
            return (answer.conditions[0].seconds || 0) + (answer.conditions[0].minutes || 0) * 60;
        }
    }
    return 0;
};

/**********
 * GET REPLY
 */
export const cleanStr = (str?: string): string => {
    if (!str) { return ''; }
    return str.toLowerCase().trim();
};
export const splitStringInWords = (str: string): string[] => {
    if (!str) { return []; }
    return cleanStr(str).match(/([a-zàäâéèëêìïîôöùüûÿç]+|[\!\?\.\,\;\:\+\-\_\*\=\&\"\'\(\)\{\}\[\$\%\£\€\@\#\\\/]+)/gi);
};
export const searchStr = (str: string): string => {
    return splitStringInWords(str).map(w => ` ${w} `).join('');
};
export const hearWord = (message: string, word: string): boolean => {
    if (!word) { return false; }
    return searchStr(message).includes(searchStr(word));
};
export const hearWords = (message: string, words: string[]): boolean => {
    for (const word of words) {
        if (hearWord(message, word)) {
            return true;
        }
    }
    return false;
};
export const matchConditionHear = (message: string, condition: AnswerConditionHear): boolean => {
    return hearWords(message, condition.words);
};
export const matchConditionRegexp = (message: string, condition: AnswerConditionRegexp): boolean => {
    return condition.regex.test(message);
};
export const matchConditionWait = (message: string, condition: AnswerConditionWait, userInfo: UserInfo): boolean => {
    return differenceInSeconds(Date.now(), userInfo.lastReplyDate) > (condition.seconds || 0) + (condition.minutes || 0) * 60;
};
export const matchConditionWaitHour = (message: string, condition: AnswerConditionWaitHour, userInfo: UserInfo): boolean => {
    const timeGap = userInfo.runtimeData.timeGap || {};
    const now = sub(Date.now(), timeGap);
    const lastReplyTime = sub(userInfo.lastReplyDate, timeGap);
    return (
        getHours(now) >= condition.hour
    ) && ((
        differenceInCalendarDays(now, lastReplyTime) >= 1
    ) || (
        differenceInCalendarDays(now, lastReplyTime) === 0 &&
        getHours(lastReplyTime) < condition.hour
    ));
};
export const matchConditionWeekDays = (message: string, condition: AnswerConditionWeekDays): boolean => {
    return condition.days.includes(getDay(Date.now()));
};
export const matchConditionSpeak = (message: string, condition: AnswerConditionSpeak): boolean => {
    return !!message;
};
export const matchConditionCondFn = (message: string, condition: AnswerConditionCondFn, userInfo: UserInfo): boolean => {
    return condition.fn(userInfo.runtimeData, message, userInfo);
};
export const matchCondition = (condition: AnswerCondition, message: string, userInfo: UserInfo): boolean => {
    switch (condition.type) {
        case AnswerConditionType.Hear:
            return matchConditionHear(message, condition);
        case AnswerConditionType.MatchRegex:
            return matchConditionRegexp(message, condition);
        case AnswerConditionType.Wait:
            return matchConditionWait(message, condition, userInfo);
        case AnswerConditionType.Speak:
            return matchConditionSpeak(message, condition);
        case AnswerConditionType.CondFn:
            return matchConditionCondFn(message, condition, userInfo);
        case AnswerConditionType.WaitHour:
            return matchConditionWaitHour(message, condition, userInfo);
        case AnswerConditionType.WeekDays:
            return matchConditionWeekDays(message, condition);
        default:
            return false;
    }
};
export const matchConditions = (conditions: AnswerCondition[], message: string, userInfo: UserInfo): boolean => {
    for (const condition of conditions) {
        if (!matchCondition(condition, message, userInfo)) {
            return false;
        }
    }
    return true;
};
export const matchAnswers = (answers: Answer[], message: string, userInfo: UserInfo): Answer => {
    for (const answer of answers) {
        if (!answer.conditions || matchConditions(answer.conditions, message, userInfo)) {
            return answer;
        }
    }
    return null;
};
export const getReplyById = (replies: Reply[], id: string): Reply => {
    for (const botData of replies) {
        if (botData.id === id) {
            return botData;
        }
    }
    return null;
};

export const calculateNextId = (userInfo: UserInfo, message: string, nextId: NextIdType): string => {
    if (nextId === ReturnId) {
        return userInfo.returnId;
    } else if (typeof nextId === 'string') {
        return nextId;
    } else {
        return nextId(userInfo, message);
    }
};
export const getReplyByNextId = (replies: Reply[], userInfo: UserInfo, message: string, nextId: NextIdType): Reply => {
    return getReplyById(replies, calculateNextId(userInfo, message, nextId));
};
export const findAnswerReply = (replies: Reply[], userInfo: UserInfo, message: string, answer: Answer): Reply => {
    return getReplyByNextId(replies, userInfo, message, answer.nextId);
};

const getCountdownReply = (
    replies: Reply[], userInfo: UserInfo, message: string,
    reply: ReplyCountdown, replyDate: Date, isCountDownCheck = false
): Reply => {
    const diff = differenceInSeconds(Date.now(), replyDate);
    if (diff >= reply.seconds) {
        return getReplyByNextId(replies, userInfo, message, reply.nextId);
    }
    if (!reply.countEvery || !isCountDownCheck) {
        return null;
    }
    const timeLeft = Math.round(reply.seconds - diff);
    return {
        id: `countdown-${timeLeft}`,
        type: MessageType.Count,
        message: `${timeLeft}s...`,
    };
};

export const getAnswer = (replies: Reply[], userInfo: UserInfo, message?: string): Answer => {
    const lastReply = userInfo.lastReply;
    if (lastReply && lastReply.answers) {
        const answer = matchAnswers(lastReply.answers, message, userInfo);
        return answer;
    }
    return null;
};

export const getReply = (replies: Reply[], userInfo: UserInfo, message?: string, isCountdownCheck = false): {
    reply?: Reply,
    answer?: Answer,
} => {
    const lastReply = userInfo.lastReply;
    if (lastReply && lastReply.answers) {
        const answer = matchAnswers(lastReply.answers, message, userInfo);
        if (answer) {
            return {
                reply: findAnswerReply(replies, userInfo, message, answer),
                answer,
            }
        }
    }
    if (lastReply && lastReply.type === MessageType.Countdown) {
        return {
            reply: getCountdownReply(replies, userInfo, message, lastReply, userInfo.lastReplyDate, isCountdownCheck),
        };
    }
    return {};
};
