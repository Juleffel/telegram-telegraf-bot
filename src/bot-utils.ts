import {UserInfo} from "./user-info";
import {Answer, Reply, replyWaitTime} from "./replies";
import {formatDistance} from "date-fns";


export const fnUpdateUserInfoWithReply = (userInfo: UserInfo, reply: Reply): UserInfo => {
    const newUserInfo = {
        ...userInfo,
        lastReply: reply,
        lastReplyDate: new Date(),
        repliesCount: userInfo.repliesCount + 1,
    };
    if (userInfo.interval) {
        clearInterval(userInfo.interval);
        delete newUserInfo.interval;
    }
    if (userInfo.timeout) {
        clearInterval(userInfo.timeout);
        delete newUserInfo.timeout;
    }
    return newUserInfo;
};


export const logReply = (message: string, reply: Reply, answer: Answer, userName: string, userInfo: UserInfo) => {
    if (!reply) {
        const timeToWait = replyWaitTime(userInfo.lastReply);
        if (timeToWait > 0) {
            console.log(`${userName} is waiting since ${
                formatDistance(Date.now(), userInfo.lastReplyDate, {includeSeconds: true})
                } and has to wait ${timeToWait}s.`);
        } else {
            console.group(`Reply not found for ${userName}`);
            console.log('Message:', message);
            console.log('userData.info:');
            const info = {...userInfo};
            delete info.timeout;
            delete info.interval;
            console.log(JSON.stringify(info, null, 2));
            console.groupEnd();
        }
    } else {
        console.group(`Reply found for ${userName}`);
        console.log('Message:', message);
        console.log('userData.info:');
        const info = {...userInfo};
        delete info.timeout;
        delete info.interval;
        console.log(JSON.stringify(info, null, 2));
        console.log('reply:');
        console.log(JSON.stringify(reply, null, 2));
        console.log('answer:');
        console.log(JSON.stringify(answer, null, 2));
        console.groupEnd();
    }
};
