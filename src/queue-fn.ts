import {Observable, of} from "rxjs";
import {mergeMap, shareReplay} from "rxjs/operators";

export class QueueFn<T> {
    private _currentObs: Observable<T> = of(null);

    constructor(
        private fn: (...args: any[]) => Observable<T>
    ) {}

    queue(...args: any[]): Observable<T> {
        this._currentObs = this._currentObs.pipe(
            mergeMap(() => {
                return this.fn.apply(null, args) as Observable<T>;
            }),
            shareReplay(1),
        );
        return this._currentObs;
    }
}
