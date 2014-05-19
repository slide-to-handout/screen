///<reference path="../DefinitelyTyped/node/node.d.ts" />
///<reference path="../DefinitelyTyped/express/express.d.ts" />
///<reference path="../DefinitelyTyped/socket.io/socket.io.d.ts" />
"use strict";

import express = require('express');
import http = require('http');
import fs = require('fs');
import url = require('url');
import path = require('path');
import socketio = require('socket.io');

var app = express();
export var server = http.createServer(app);
var io = socketio.listen(server);

app.use('/static', express.static(path.join(__dirname, '..', 'static')));
app.use('/scripts', express.static(path.join(__dirname, 'web')));

// to enable sourcemap for debugging; should not be enabled on the production.
app.use('/src/web', express.static(path.join(__dirname, '..', 'src', 'web')));

app.get('/', function (req: express.Request, res: express.Response) {
    res.sendfile(path.join(__dirname, '..', 'static', 'viewer.html'));
});
