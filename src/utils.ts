import Timeout = NodeJS.Timeout;
import {map, mergeMap, tap} from "rxjs/operators";
import {MonoTypeOperatorFunction, Observable, of, OperatorFunction} from "rxjs";

/*****
 * INTERVALS
 */
export const setIntervalForOccurences = (fn: () => void, interval: number, nbOccurences: number): Timeout => {
    let occurence = 0;
    const intervalObj = setInterval(() => {
        occurence++;
        if (occurence > nbOccurences) {
            clearInterval(intervalObj);
        } else {
            fn();
        }
    }, interval);
    return intervalObj;
};

export const calculateNbOccurence = (interval: number, time: number, include = true): number => {
    const nbOccurenceInclude = Math.floor(time / interval);
    if (!include && nbOccurenceInclude === time / interval) {
        return nbOccurenceInclude - 1;
    } else {
        return nbOccurenceInclude;
    }
};

export const setIntervalForTime = (fn: () => void, interval: number, time: number, include = true): Timeout => {
    const nbOccurence = calculateNbOccurence(interval, time, include);
    return setIntervalForOccurences(fn, interval, nbOccurence);
};

/*******
 * RxJS
 *********/

export const mapIf = <T1, T2>(ifFn: (arg: T1) => boolean, fn: (arg: T1) => T2): OperatorFunction<T1, T2> => {
    return map((arg: T1) => {
        if (!ifFn(arg)) { return null; }
        return fn(arg);
    });
};
export const mapToIf = <T1, T2>(ifFn: (arg: T1) => boolean, o: T2): OperatorFunction<T1, T2> => {
    return mapIf(ifFn, () => o);
};
export const mapIfTruthy = <T1, T2>(fn: (arg: T1) => T2): OperatorFunction<T1, T2> => {
    return mapIf((arg) => (!!arg), fn);
};
export const mapToIfTruthy = <T1, T2>(o: T2): OperatorFunction<T1, T2> => {
    return mapIfTruthy(() => o);
};
export const mergeMapIf = <T1, T2>(ifFn: (arg: T1) => boolean, fn: (arg: T1) => Observable<T2>): OperatorFunction<T1, T2> => {
    return mergeMap((arg: T1) => {
        if (!ifFn(arg)) { return of(null); }
        return fn(arg);
    });
};
export const mergeMapToIf = <T1, T2>(ifFn: (arg: T1) => boolean, o: Observable<T2>): OperatorFunction<T1, T2> => {
    return mergeMapIf(ifFn, () => o);
};
export const mergeMapIfTruthy = <T1, T2>(fn: (arg: T1) => Observable<T2>): OperatorFunction<T1, T2> => {
    return mergeMapIf((arg) => (!!arg), fn);
};
export const mergeMapToIfTruthy = <T1, T2>(obs: Observable<T2>): OperatorFunction<T1, T2> => {
    return mergeMapIfTruthy(() => obs);
};
export const mapToBoolean = <T1>(): OperatorFunction<T1, boolean> => {
    return map(Boolean);
};
export const tapLog = tap((...args) => console.log.apply(null, args));

/******
 * Helpers
 *******/
export const countBooleans = (booleans: boolean[]): number => {
    let count = 0;
    for (const b of booleans) {
        if (b) { count++; }
    }
    return count;
};
