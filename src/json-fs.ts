import {Observable, of, Subject} from "rxjs";
import * as fs from "fs";
import {QueueFn} from "./queue-fn";

const DEBUG = false;

let writing = false;

export const writeAsJsonNoQueuing = (filePath: string, object: any): Observable<boolean> => {
    if (writing) {
        return of(false);
    }

    writing = true;

    const success = new Subject<boolean>();

    fs.writeFile(filePath, JSON.stringify(object), {encoding:'utf-8', flag:'w'}, function (err) {
        writing = false;
        if(err) {
            console.error('writeAsJson failed:', err);
            success.next(false);
        } else {
            if (DEBUG) { console.log(`${filePath} saved.`); console.log(JSON.stringify(object, null, 2)); }
            success.next(true);
        }
        success.complete();
    });

    return success;
};

const queueWriteAsJson = new QueueFn(writeAsJsonNoQueuing);

export const writeAsJson = (filePath: string, object: any): Observable<boolean> => {
    return queueWriteAsJson.queue(filePath, object);
};

export const readAsJson = <T>(filePath: string): Observable<T> => {
    const success = new Subject<T>();

    fs.readFile(filePath, {encoding:'utf-8', flag:'r'}, function (err, data) {
        if(err) {
            console.error('readAsJson failed:', err);
            success.next(null);
        } else {
            if (DEBUG) { console.log(`${filePath} read.`); }
            let obj: T;
            try {
                obj = JSON.parse(data);
            } catch (e) {
                console.error('File impossible to parse as JSON:', data);
            }
            success.next(obj);
        }
        success.complete();
    });

    return success;
};

export const deleteFile = (filePath: string): Observable<boolean> => {
    const success = new Subject<boolean>();

    fs.access(filePath, error => {
        if (!error) {
            fs.unlink(filePath,function(error){
                if (error) {
                    console.error('deleteFile unlink failed:', error);
                    success.next(false);
                } else {
                    if (DEBUG) { console.log(`${filePath} deleted.`); }
                    success.next(true);
                }
                success.complete();
            });
        } else {
            console.error('deleteFile access failed:', error);
            success.next(false);
            success.complete();
        }
    });

    return success;
};
