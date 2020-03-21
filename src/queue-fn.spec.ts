import {forkJoin, Observable, of, timer} from "rxjs";
import {QueueFn} from "./queue-fn";
import {mapTo, mergeMap, tap} from "rxjs/operators";

describe('QueueFn', () => {
    const testFnSync = (message: string, ret: number): Observable<string> => {
        return of(`${message}-${ret}`);
    };

    const queueFnSync = new QueueFn(testFnSync);

    test('queueFnSync 1 call', () => {

        return queueFnSync.queue('hello1', 1).pipe(
            tap(ret => {
                expect(ret).toEqual('hello1-1');
            }),
        ).toPromise();
    });

    test('queueFnSync 3 call', () => {

        return queueFnSync.queue('hello1', 1).pipe(
            mergeMap(ret => {
                expect(ret).toEqual('hello1-1');
                return queueFnSync.queue('hello2', '2');
            }),
            mergeMap(ret => {
                expect(ret).toEqual('hello2-2');
                return queueFnSync.queue('hello3', 3);
            }),
            tap(ret => {
                expect(ret).toEqual('hello3-3');
            }),
        ).toPromise();
    });

    let globalVar = 0;

    const testFnAsync = (message: string, ret: number, time: number): Observable<string> => {
        globalVar = ret;
        return timer(time).pipe(
            mapTo(`${message}-${globalVar}`),
        );
    };

    const queueFnAsync = new QueueFn(testFnAsync);

    test.only('queueFnAsync 4 call simultaneous', () => {

        return forkJoin([
            queueFnAsync.queue('hello1', 1, 30),
            queueFnAsync.queue('hello3', 3, 10),
            queueFnAsync.queue('hello2', 2, 30),
            queueFnAsync.queue('hello4', 4, 20),
        ]).pipe(
            tap(([r1, r2, r3, r4]) => {
                expect(r1).toEqual('hello1-1');
                expect(r2).toEqual('hello3-3');
                expect(r3).toEqual('hello2-2');
                expect(r4).toEqual('hello4-4');
            }),
        ).toPromise();
    });
});
