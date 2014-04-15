///<reference path="../DefinitelyTyped/node/node.d.ts" />
///<reference path="../DefinitelyTyped/express/express.d.ts" />
"use strict";

import express = require('express');
import fs = require('fs');
import url = require('url');
import path = require('path');

export var app = express();

app.use('/static', express.static(path.join(__dirname, '..', 'static')));
app.use('/scripts', express.static(path.join(__dirname, 'web')));
app.use('/src/web', express.static(path.join(__dirname, '..', 'src', 'web')));

app.get('/', function (req: express.Request, res: express.Response) {
    res.sendfile(path.join(__dirname, '..', 'static', 'viewer.html'));
});
