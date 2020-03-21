import {calculateNbOccurence, setIntervalForTime, setIntervalForOccurences} from "./utils";
import {of} from "rxjs";
import {tapExpectObj} from "./specUtils";
import {delay, tap} from "rxjs/operators";

test('calculateNbOccurence', () => {
    expect(calculateNbOccurence(100, 1000, true)).toBe(10);
    expect(calculateNbOccurence(100, 1000, false)).toBe(9);
    expect(calculateNbOccurence(100, 1050, true)).toBe(10);
    expect(calculateNbOccurence(100, 1050, false)).toBe(10);
});

test('setIntervalForOccurences', () => {
    let global = 0;
    const tapExpectGlobal = (n: number) => tap(() => {
        expect(global).toBe(n);
    });
    setIntervalForOccurences(() => {
        global++;
    }, 10, 10);
    of(true).pipe(
        tapExpectGlobal(0),
        delay(15),
        tapExpectGlobal(1),
        delay(20),
        tapExpectGlobal(3),
        delay(100),
        tapExpectGlobal(10),
    ).toPromise();
});

test('setIntervalForTime include', () => {
    let global = 0;
    const tapExpectGlobal = (n: number) => tap(() => {
        expect(global).toBe(n);
    });
    setIntervalForTime(() => {
        global++;
    }, 10, 100);
    of(true).pipe(
        tapExpectGlobal(0),
        delay(15),
        tapExpectGlobal(1),
        delay(20),
        tapExpectGlobal(3),
        delay(100),
        tapExpectGlobal(10),
    ).toPromise();
});
