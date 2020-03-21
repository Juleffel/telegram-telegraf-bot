import {AnswerConditionType, EffectType, MessageType, Reply, ReturnId} from './replies';
import {Observable, of} from "rxjs";
import {ajax} from "rxjs/ajax";
// @ts-ignore
import {XMLHttpRequest} from 'xmlhttprequest';
import {catchError, map} from "rxjs/operators";
import {getHours, getMinutes} from "date-fns";

const wordsHello = ['hi', 'hello', 'lo'];
const wordsYes = ['yes', 'yep', 'i do', 'yeah', 'i am', "let's go"];
const wordsNo = ['no', 'nop', 'nope', 'i don\'t'];
const wordsFor = ['for', 'what', '?', 'help'];

function createXHR() {
    return new XMLHttpRequest();
}

export const botDatasetInit: Reply[] = [
    {
        id: 'init',
        type: MessageType.Text,
        message: 'Hello dude!',
        answers: [{
            nextId: 'set-time-gap-1',
            example: 'Hello Mr Bot!',
            effects: [{
                type: EffectType.SetReturnId,
                returnId: 'init-2',
            }],
            conditions: [{
                type: AnswerConditionType.Hear,
                words: wordsHello,
            }],
        }, {
            nextId: 'init-1-long',
            conditions: [{
                type: AnswerConditionType.Hear,
                words: ['long'],
            }],
        }, {
            nextId: 'test-multiple-msg-1',
            example: 'Test multiple messages',
            conditions: [{
                type: AnswerConditionType.Hear,
                words: ['multiple'],
            }],
        }, {
            nextId: 'test-logic-1',
            example: 'Test Logic',
            conditions: [{
                type: AnswerConditionType.Hear,
                words: ['logic'],
            }],
        }, {
            nextId: 'test-next-id-1',
            example: 'Test Next Id',
            conditions: [{
                type: AnswerConditionType.Hear,
                words: ['next'],
            }],
        }, {
            nextId: 'test-var-1',
            example: 'Test Var',
            conditions: [{
                type: AnswerConditionType.Hear,
                words: ['var'],
            }],
        }, {
            nextId: 'test-img-1',
            example: 'Test Image',
            conditions: [{
                type: AnswerConditionType.Hear,
                words: ['image', 'img'],
            }],
        }, {
            nextId: 'test-weather-1',
            example: 'Test Weather',
            conditions: [{
                type: AnswerConditionType.Hear,
                words: ['weather', 'météo'],
            }],
        }, {
            nextId: 'init-1-waiting',
            conditions: [{
                type: AnswerConditionType.Wait,
                seconds: 30,
            }],
        }]
    },
    {
        id: 'init-1-waiting',
        type: MessageType.Text,
        message: 'You could just say hi, you know?',
        answers: [{
            nextId: 'init-2',
            example: 'Hi...',
            conditions: [{
                type: AnswerConditionType.Hear,
                words: wordsHello,
            }],
        }, {
            nextId: 'init-1-waiting',
            conditions: [{
                type: AnswerConditionType.Wait,
                minutes: 2,
            }],
        }]
    },
    {
        id: 'init-1-long',
        type: MessageType.Text,
        message: "~Let's~ *test* _this keyboard_, __shall we__?'",
        replyOptions: [
            "Je ne crois pas qu'il y ai de bonnes ou de mauvaises situations",
            "Moi si je devais résumer ma vie aujourd'hui",
            "Ce serait",
            "Du chocolat",
            "Des nouilles",
            ".",
            "Alea Jacta Est!"
        ],
    },
    {
        id: 'init-2',
        type: MessageType.Text,
        message: 'Are you ready?',
        answers: [{
            nextId: 'init-3-yes',
            example: 'Hell yeah, I am!',
            conditions: [{
                type: AnswerConditionType.Hear,
                words: wordsYes,
            }],
        }, {
            nextId: 'init-3-no',
            example: 'Hmmm no thx!',
            conditions: [{
                type: AnswerConditionType.Hear,
                words: wordsNo,
            }],
        }, {
            nextId: 'init-3-for',
            conditions: [{
                type: AnswerConditionType.Hear,
                words: wordsFor,
            }],
        }, {
            nextId: 'init-3-else',
            conditions: [{
                type: AnswerConditionType.Speak,
            }],
        }]
    },
    {
        id: 'init-3-yes',
        type: MessageType.Countdown,
        message: "Ah that's good! Let's count 30 seconds, then.",
        seconds: 30,
        countEvery: 5,
        nextId: 'init-5-count-down',
        answers: [{
            nextId: 'init-5-stop',
            example: 'Stoooop!',
            conditions: [{
                type: AnswerConditionType.Hear,
                words: ['stop', 'stooop', 'stoooop'],
            }],
        }]

    },
    {
        id: 'init-3-no',
        message: "Damn... I would have been sure you were... Are you ready now?",
        answers: [{
            nextId: 'init-3-yes',
            example: 'I am ready.',
            conditions: [{
                type: AnswerConditionType.Hear,
                words: wordsYes,
            }],
        }, {
            nextId: 'init-4-bye',
            conditions: [{
                type: AnswerConditionType.Speak,
            }],
        }]
    },
    {
        id: 'init-3-for',
        message: "For what? Well, I don't know. Som'thing, I suppose. So, yes?",
        answers: [{
            nextId: 'init-3-yes',
            example: "Let's go",
            conditions: [{
                type: AnswerConditionType.Hear,
                words: wordsYes,
            }],
        },
        {
            nextId: 'init-4-bye',
            conditions: [{
                type: AnswerConditionType.Speak,
            }],
        },
        ]
    },
    {
        id: 'init-3-else',
        message: "I didn't catch that, please answer by yes or no, please... Are you ready? That's yes or no, that's it!",
        answers: [{
            nextId: 'init-3-yes',
            example: "Yes",
            conditions: [{
                type: AnswerConditionType.Hear,
                words: wordsYes,
            }],
        }, {
            nextId: 'init-3-no',
            example: "No",
            conditions: [{
                type: AnswerConditionType.Hear,
                words: wordsNo,
            }],
        }, {
            nextId: 'init-4-bye',
            conditions: [{
                type: AnswerConditionType.Speak,
            }],
        }]
    },
    {
        id: 'init-4-bye',
        message: "Well... Too bad... Good bye!",
    },
    {
        id: 'init-5-count-down',
        message: "Boom."
    },
    {
        id: 'init-5-stop',
        type: MessageType.Countdown,
        message: "What? Let's try again with 10 seconds... Without counting out loud! Nor possibility to interrupt ;)",
        seconds: 10,
        nextId: 'init-5-count-down',
    },
];

const testMultiple: Reply[] = [
    {
        id: 'test-multiple-msg-1',
        message: 'Msg 1',
        answers: [{
            nextId: 'test-multiple-msg-2',
        }],
    },
    {
        id: 'test-multiple-msg-2',
        message: 'Msg 2',
        answers: [{
            nextId: 'test-multiple-msg-3',
        }],
    },
    {
        id: 'test-multiple-msg-3',
        message: 'Msg 3',
    },
];

const testLogic: Reply[] = [
    {
        id: 'test-logic-1',
        type: MessageType.Logic,
        answers: [{
            nextId: 'test-logic-2',
        }],
    },
    {
        id: 'test-logic-2',
        message: 'OK',
    },
];

const testNextId: Reply[] = [
    {
        id: 'test-next-id-1',
        type: MessageType.Logic,
        answers: [{
            effects: [
                {
                    type: EffectType.SetData,
                    updates: {
                        'runtimeData.nextId': 'test-next-id-2',
                    }
                }
            ],
            nextId: (userInfo) => userInfo.runtimeData.nextId,
        }],
    },
    {
        id: 'test-next-id-2',
        message: 'OK',
    },
];

const testVar: Reply[] = [
    {
        id: 'test-var-1',
        message: 'Please enter your name:',
        answers: [{
            conditions: [{
                type: AnswerConditionType.Speak,
            }],
            effects: [
                {
                    type: EffectType.UpdateData,
                    updates: {
                        'runtimeData.name': (_, message) => message,
                    }
                }
            ],
            nextId: 'test-var-2',
        }],
    },
    {
        id: 'test-var-2',
        message: 'Your name is {{name}}!',
    },
];

const testImage: Reply[] = [
    {
        id: 'test-img-1',
        type: MessageType.ImageUrl,
        url: 'https://upload.wikimedia.org/wikipedia/en/6/68/WTHR_13_logo_2014.png',
        answers: [{
            effects: [{
                type: EffectType.SetData,
                updates: {
                    'runtimeData.nextCaption': 'Hello!',
                }
            }],
            nextId: 'test-img-2',
        }],
    },
    {
        id: 'test-img-2',
        type: MessageType.ImageUrl,
        url: 'https://upload.wikimedia.org/wikipedia/fr/5/5b/Google_Keep.png',
        caption: '{{nextCaption}}',
        answers: [{
            nextId: 'test-img-3',
        }]
    },
    {
        id: 'test-img-3',
        type: MessageType.ImagePath,
        path: './assets/test.png',
        caption: '{{nextCaption}}',
    },
];

const weatherApiKey = 'b60ef0cffc605ab6196cc06f6adc4fda';
const getWeather = (cityName: string): Observable<any> => {
    return ajax({
        createXHR, // <--- here
        url: `http://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${weatherApiKey}&units=metric`,
        crossDomain: true,
        withCredentials: false,
        method: 'GET',
    }).pipe(
        map((res) => {
            console.log('ajax result:', res.response);
            return res.response;
        }),
        catchError((error) => {
            console.log('Error getting weather data:', error);
            return of({
                error,
            })
        }),
    );
};

const testWeather: Reply[] = [
    {
        id: 'test-weather-1',
        message: "What's your city name ?",
        answers: [{
            conditions: [{
                type: AnswerConditionType.Speak,
            }],
            effects: [
                {
                    type: EffectType.UpdateData,
                    updates: {
                        'runtimeData.cityName': (_, message) => message,
                    }
                }
            ],
            nextId: 'test-weather-2',
        }],
    },
    {
        id: 'test-weather-2',
        type: MessageType.Logic,
        answers: [{
            effects: [
                {
                    type: EffectType.UpdateDataAsync,
                    updates: {
                        'runtimeData.weatherResult': (userInfo) => getWeather(userInfo.runtimeData.cityName),
                    }
                }
            ],
            nextId: 'test-weather-3',
        }]
    },
    {
        id: 'test-weather-3',
        type: MessageType.Logic,
        answers: [
            {
                conditions: [{
                    type: AnswerConditionType.CondFn,
                    fn: (runtimeData) => (!runtimeData.weatherResult || runtimeData.weatherResult.error),
                }],
                nextId: 'test-weather-4-generic-error',
            },
            {
                nextId: 'test-weather-4-ok',
            },
        ],
    },
    {
        id: 'test-weather-4-error-401',
        message: 'A 401 error occurred.',
    },
    {
        id: 'test-weather-4-generic-error',
        message: 'A generic error occurred: {{weatherResult.error.response.message}}.',
    },
    {
        id: 'test-weather-4-ok',
        message: 'Temperature in {{cityName}} is {{weatherResult.main.temp}} °C ! ;)',
    },
];

const setTimeGap: Reply[] = [
    {
        id: 'set-time-gap-1',
        type: MessageType.Logic,
        answers: [
            {
                conditions: [{
                    type: AnswerConditionType.CondFn,
                    fn: (runtimeData) => (runtimeData.timeGap),
                }],
                nextId: ReturnId,
            },
            {
                nextId: 'set-time-gap-2',
            },
        ],
    },
    {
        id: 'set-time-gap-2',
        message: "What's the time at your place ? ( Just reply hh:mm on 24 hours format, thx! )",
        answers: [{
            conditions: [{
                type: AnswerConditionType.MatchRegex,
                regex: /^[0-2][0-9]:[0-5][0-9]$/,
            }],
            effects: [
                {
                    type: EffectType.UpdateData,
                    updates: {
                        'runtimeData.timeGap': (_, message) => {
                            const now = new Date();
                            const nowHours = getHours(now);
                            const nowMinutes = getMinutes(now);
                            const [m, messageHours, messageMinutes] = message.match(/^([0-2][0-9]):([0-5][0-9)])$/);
                            let diffHours = parseInt(messageHours) - nowHours;
                            if (diffHours > 12) {
                                diffHours -= 24;
                            } else if (diffHours < -12) {
                                diffHours += 24;
                            }
                            const diffMinutes = parseInt(messageMinutes) - nowMinutes + diffHours * 60;
                            return {
                                minutes: diffMinutes,
                            }
                        },
                    }
                }
            ],
            nextId: 'set-time-gap-3',
        }, {
            conditions: [{
                type: AnswerConditionType.Speak,
            }],
            nextId: 'set-time-gap-2',
        }],
    },
    {
        id: 'set-time-gap-3',
        message: "Thanks! I'll remember that!",
        answers: [{
            nextId: ReturnId,
        }]
    },
];


export const botDataset: Reply[] = [
    ...botDatasetInit,
    ...testMultiple,
    ...testLogic,
    ...testNextId,
    ...testVar,
    ...testImage,
    ...testWeather,
    ...setTimeGap,
];
