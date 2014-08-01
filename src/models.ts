///<reference path="../DefinitelyTyped/q/Q.d.ts" />
"use strict";

import Q = require('q');

import database = require('./database');

    /*database.connect().then(function (db) {
        db.collection('users', function (err, users) {
            var data = {

            };
            users.update({'facebook_userid': req}, data, {upsert: true, fullResult: true}, function (err, result) {
                res.render(result);
            });
        });
    });*/


class Collection {
    private dbConnection;

    constructor() {
        this.dbConnection
    }
}


export class SessionCollection {
    static collectionName = 'session';
    static getByKey(key: string): Q.Promise<any> {
        return database.connect()
            .invoke('collection', this.collectionName);
    }
}
