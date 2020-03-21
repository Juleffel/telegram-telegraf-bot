import {tap} from "rxjs/operators";
import {MonoTypeOperatorFunction} from "rxjs";

export const tapExpectTrue = tap(success => {
    expect(success).toBe(true);
});
export const tapExpectObj = <T>(obj: T): MonoTypeOperatorFunction<T> => {
    return tap((retObj: T) => {
        expect(retObj).toEqual(obj);
    });
};
