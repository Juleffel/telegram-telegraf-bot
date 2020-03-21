import {getData, setData, updateData, UserData} from "./user-data";
import {mergeMap, tap} from "rxjs/operators";
import {initUserInfo} from "./user-info";

test('setData & getData & updateData', () => {
    const id = 'id1';
    const initUserData: UserData = {
        id,
        username: 'Juleffel',
        info: initUserInfo,
        ctx: null,
    };
    return setData(id, initUserData, false).pipe(
        mergeMap(res => {
            expect(res).toBe(true);
            return getData(id);
        }),
        mergeMap(userData => {
            expect(userData).toEqual(initUserData);
            return updateData(id, ['info', 'messagesCount'], (c: number) => (c + 1), false);
        }),
        mergeMap(res => {
            expect(res).toBe(true);
            return getData(id);
        }),
        tap(userData => {
            expect(userData).toMatchObject({
                info: {
                    messagesCount: 1,
                },
            });
        }),
    ).toPromise();
});
