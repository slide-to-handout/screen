///<reference path="../DefinitelyTyped/mongodb/mongodb.d.ts" />
///<reference path="../DefinitelyTyped/q/Q.d.ts" />
"use strict";

import mongodb = require('mongodb');
import Q = require('q');

var MongoClient = mongodb.MongoClient;
var deferred = Q.defer<mongodb.Db>();

MongoClient.connect('mongodb://localhost/slide_to_handout', function(err, database) {
  if (err) {
    deferred.reject(err);
    return;
  }
  deferred.resolve(database);
});

export function connect(): Q.Promise<mongodb.Db> {
  return deferred.promise;
}
