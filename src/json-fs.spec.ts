import {tap} from "rxjs/operators";
import {deleteFile, readAsJson, writeAsJson} from "./json-fs";
import {forkJoin} from "rxjs";
import {tapExpectObj, tapExpectTrue} from "./specUtils";

describe('write/read/delete', () => {
    const obj = {hello: 'world!'};
    const filePath = 'test.json';
    test('saveObj', () => {
        return writeAsJson(filePath, obj).pipe(
            tapExpectTrue,
        ).toPromise();
    });
    test('readObj', () => {
        return readAsJson(filePath).pipe(
            tapExpectObj(obj),
        ).toPromise();
    });
    const obj2 = {hello: 'w'};
    test('saveObj', () => {
        return writeAsJson(filePath, obj2).pipe(
            tapExpectTrue,
        ).toPromise();
    });
    test('readObj', () => {
        return readAsJson(filePath).pipe(
            tapExpectObj(obj2),
        ).toPromise();
    });

    test('saveSimultaneous', () => {
        return forkJoin([
            writeAsJson(filePath, obj2).pipe(tapExpectTrue),
            writeAsJson(filePath, obj).pipe(tapExpectTrue),
            writeAsJson(filePath, obj2).pipe(tapExpectTrue),
            writeAsJson(filePath, obj).pipe(tapExpectTrue),
        ]).toPromise();
    });
    test('readObj', () => {
        return readAsJson(filePath).pipe(
            tapExpectObj(obj),
        ).toPromise();
    });

    test('deleteFile', () => {
        return deleteFile(filePath).pipe(
            tap(success => {
                expect(success).toEqual(true);
            }),
        ).toPromise();
    });
});
