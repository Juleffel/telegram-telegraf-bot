import Telegraf, {ContextMessageUpdate} from 'telegraf'; // Module to use Telegraf API.
import {getAllData, getDataCtx, initDataCtx, loadData, updateDataCtx, UserData} from "./user-data";
import {
    getReplyById,
    getReply,
    getReplyOptions,
    MessageType,
    PollOption,
    Reply,
    ReplyCountdown,
} from "./replies";
import {botDataset} from "./bot-dataset";
import {forkJoin, from, Observable, of} from "rxjs";
import {catchError, map, mergeMap, tap} from "rxjs/operators";
import {ExtraPhoto, ExtraReplyMessage} from "telegraf/typings/telegram-types";
import {applyEffects, replaceVarsInMessage, RuntimeData, UserInfo} from "./user-info";
import {
    countBooleans,
    mapIfTruthy,
    mapToIfTruthy,
    mergeMapIfTruthy,
    mergeMapToIfTruthy,
    setIntervalForTime, tapLog,
} from "./utils";
import {fnUpdateUserInfoWithReply, logReply} from "./bot-utils";
import {getFileId, loadFileIds, setFileId} from "./file-ids";

const config = require('./config'); // Configuration file that holds telegraf_token API key.

const bot = new Telegraf(config.telegraf_token);    // Let's instantiate a bot using our token.

// We can get bot nickname from bot informations. This is particularly useful for groups.
bot.telegram.getMe().then((bot_informations) => {
    bot.options.username = bot_informations.username;
    console.log("Server has initialized bot nickname ! Nick: "+bot_informations.username);
});

bot.use((ctx, next) => {
    getDataCtx(ctx).pipe(
        mergeMap((userData: UserData) => {
            if (userData) {
                return updateDataCtx(ctx, ['ctx'], () => ctx);
            }
            return initDataCtx(ctx);
        }),
    ).subscribe((success) => {
        if (!success) {
            console.error('Error updating or setting ctx');
        }
        next();
    }, (error) => {
        console.error('Error updating or setting ctx:', error);
        next();
    });
});

const sendMessage = (ctx: ContextMessageUpdate, message: string, replyOptions?: string[], markdown = false): Observable<boolean> => {
    const extra: ExtraReplyMessage = {};
    if (markdown) {
        extra.parse_mode = "MarkdownV2";
    }
    if (replyOptions) {
        extra.reply_markup = {
            keyboard: replyOptions.map(s => ([{text: s}])),
            resize_keyboard: true,
            one_time_keyboard: true,
        };
    }
    console.log(`sendMessage to ${ctx.from.username}: ${message}`);
    return from(ctx.reply(message, extra)).pipe(
        map(() => {
            return true;
        }),
        catchError((err) => {
            console.error('Error sending Telegraf message:', err);
            return of(false);
        }),
    );
};
const sendImageByUrl = (ctx: ContextMessageUpdate, imageUrl: string, message?: string): Observable<boolean> => {
    const extra: ExtraPhoto = {};
    if (message) {
        extra.caption = message;
    }

    return getFileId(imageUrl).pipe(
        map(fileId => {
            return fileId || imageUrl;
        }),
        mergeMap((file: string) => {
            return from(ctx.replyWithPhoto(file, extra))
        }),
        mergeMap((res) => {
            if (res && res.photo && res.photo[0].file_id) {
                return setFileId(imageUrl, res.photo[0].file_id);
            } else {
                return of(true);
            }
        }),
        catchError((err) => {
            console.error('Error sending Telegraf message:', err);
            return of(false);
        }),
    );
};
const sendImageByPath = (ctx: ContextMessageUpdate, imagePath: string, message?: string): Observable<boolean> => {
    const extra: ExtraPhoto = {};
    if (message) {
        extra.caption = message;
    }

    return getFileId(imagePath).pipe(
        map(fileId => {
            if (fileId) {
                return fileId;
            } else {
                return {source: imagePath};
            }
        }),
        mergeMap((file) => {
            return from(ctx.replyWithPhoto(file, extra))
        }),
        mergeMap((res) => {
            if (res && res.photo && res.photo[0].file_id) {
                return setFileId(imagePath, res.photo[0].file_id);
            } else {
                return of(true);
            }
        }),
        catchError((err) => {
            console.error('Error sending Telegraf message:', err);
            return of(false);
        }),
    );
};
const checkCountdown = (ctx: ContextMessageUpdate, reply: ReplyCountdown): Observable<boolean> => {
    return of(true).pipe(
        mergeMap(() => {
            if (reply.countEvery) {
                const interval = setIntervalForTime(() => {
                    replyTo(null, ctx, true).subscribe();
                }, reply.countEvery * 1000, reply.seconds * 1000, false);
                return updateDataCtx(ctx, ['info', 'interval'], () => (interval));
            } else {
                return of(true);
            }
        }),
        mergeMap(() => {
            const timeout = setTimeout(() => {
                replyToLoop(null, ctx).subscribe();
            }, (reply.seconds + 0.1) * 1000);
            return updateDataCtx(ctx, ['info', 'timeout'], () => (timeout));
        }),
    );
};
const sendPoll = (ctx: ContextMessageUpdate, message: string, pollOptions: PollOption[]): Observable<boolean> => {
    console.log(`sendPoll to ${ctx.from.username}`);
    return from(
        // @ts-ignore
        ctx.replyWithPoll(message, pollOptions.map(p => p.text), {is_anonymous: false})
    ).pipe(
        map(() => {
            return true;
        }),
        catchError((err) => {
            console.error('Error sending Telegraf message:', err);
            return of(false);
        }),
    );
};


const sendReply = (ctx: ContextMessageUpdate, reply: Reply, runtimeData: RuntimeData): Observable<boolean> => {
    switch (reply.type) {
        case MessageType.Logic:
            return of(true);
        case MessageType.Count:
            return sendMessage(ctx, replaceVarsInMessage(reply.message, runtimeData));
        case MessageType.Poll:
            return sendPoll(ctx, replaceVarsInMessage(reply.message, runtimeData), reply.pollOptions);
        case MessageType.Countdown:
            return sendMessage(ctx, replaceVarsInMessage(reply.message, runtimeData), getReplyOptions(reply), reply.markdown).pipe(
                mergeMapToIfTruthy(checkCountdown(ctx, reply)),
            );
        case MessageType.ImageUrl:
            return sendImageByUrl(ctx, reply.url, replaceVarsInMessage(reply.caption, runtimeData));
        case MessageType.ImagePath:
            return sendImageByPath(ctx, reply.path, replaceVarsInMessage(reply.caption, runtimeData));
        case MessageType.Text:
        default:
            return sendMessage(ctx, replaceVarsInMessage(reply.message, runtimeData), getReplyOptions(reply), reply.markdown);
    }
};


const updateUserInfoWithReply = (ctx: ContextMessageUpdate, reply: Reply): Observable<boolean> => {
    return updateDataCtx(ctx, ['info'], (userInfo: UserInfo): UserInfo => {
        return fnUpdateUserInfoWithReply(userInfo, reply);
    });
};

const replyBotData = (ctx: ContextMessageUpdate, reply?: Reply): Observable<boolean> => {
    return of(!!reply).pipe(
        mergeMapIfTruthy(() => {
            if (reply.type !== MessageType.Count) {
                return updateUserInfoWithReply(ctx, reply);
            } else {
                return of(true);
            }
        }),
        mergeMapToIfTruthy(getDataCtx(ctx)),
        mapIfTruthy((data: UserData) => data.info.runtimeData),
        mergeMapIfTruthy((runtimeData) => sendReply(ctx, reply, runtimeData)),
    );
};

const replyTo = (message: string, ctx: ContextMessageUpdate, isCountdownCheck = false): Observable<boolean> => {
    return of(true).pipe(
        mergeMapIfTruthy(() => {
            if (message) {
                return updateDataCtx(ctx, ['info'], (info: UserInfo): UserInfo => ({
                    ...info,
                    lastMessage: message,
                    lastMessageDate: new Date(),
                    messagesCount: info.messagesCount + 1,
                }));
            } else {
                return of(true);
            }
        }),
        mergeMapToIfTruthy(getDataCtx(ctx)),
        mapIfTruthy((userData: UserData) => {
            return {
                ...getReply(botDataset, userData.info, message, isCountdownCheck),
                userInfo: userData.info,
            };
        }),
        mergeMapIfTruthy((r) => {
            return applyEffects(r.reply, r.answer, message, r.userInfo).pipe(
                map((newUserInfo) => ({
                    ...r,
                    newUserInfo,
                })),
            );
        }),
        mergeMapIfTruthy((r) => {
            if (r.reply && r.newUserInfo) {
                return updateDataCtx(ctx, ['info'], () => r.newUserInfo).pipe(
                    mapToIfTruthy(r.reply),
                );
            } else {
                return of(r.reply);
            }
        }),
        mergeMapIfTruthy((reply: Reply) => {
            return replyBotData(ctx, reply);
        }),
        map(Boolean),
    );
};

const replyToLoop = (message: string, ctx: ContextMessageUpdate, isCountdownCheck = false): Observable<boolean> => {
    return replyTo(message, ctx, isCountdownCheck).pipe(
        mergeMapIfTruthy(() => {
            return replyToLoop(null, ctx)
        }),
    );
};

// Command example, pretty easy. Each callback passes as parameter the context.
// Context data includes message info, timestamp, etc; check the official documentation or print ctx.
bot.start((ctx: ContextMessageUpdate) => {
    initDataCtx(ctx).pipe(
        mergeMap(() => {
            const initReply = getReplyById(botDataset, 'init');
            return replyBotData(ctx, initReply);
        }),
    ).subscribe();
});

bot.command('/explain', (ctx) => {
    console.log('/explain by', ctx.from.username);
    getDataCtx(ctx).pipe(
        tap((userData) => {
            if (!userData) {
                console.error('No userData found for', ctx.from.username);
            } else {
                const {reply, answer} = getReply(botDataset, userData.info, null);
                logReply(null, reply, answer, ctx.from.username, userData.info);
            }
        }),
    ).subscribe();
});

bot.command('/repeat', (ctx) => {
    console.log('/repeat by', ctx.from.username);
    getDataCtx(ctx).pipe(
        mergeMap((userData) => {
            return replyBotData(ctx, userData.info.lastReply);
        }),
    ).subscribe();
});

bot.on('message', (ctx) => {
    replyToLoop(ctx.message.text, ctx).subscribe();
});

const checkUsersForReplies = (allUserData: UserData[]): Observable<boolean[]> => {
    return forkJoin(allUserData.map(userData => {
        if (userData.ctx) {
            return replyToLoop(null, userData.ctx);
        }
        return of(false);
    }));
};

const regularlyCheckUsersForReplies = (intervalInSeconds: number): void => {
    setInterval(() => {
        getAllData().pipe(
            mergeMap(allUserData => {
                return checkUsersForReplies(allUserData);
            }),
            map(successes => {
                return countBooleans(successes);
            }),
        ).subscribe((nbSuccesses) => {
            if (nbSuccesses === 0) {
                console.info('Users checked but no response available.');
            } else {
                console.log(`Users checked: ${nbSuccesses} responses sent.`);
            }
        }, (error) => {
            console.error('Error in regularlyCheckUsersForReplies:', error);
        });
    }, intervalInSeconds * 1000);
};

regularlyCheckUsersForReplies(7);

loadData();
loadFileIds();

// Start bot polling in order to not terminate Node.js application.
bot.startPolling();

