///<reference path="../DefinitelyTyped/node/node.d.ts" />
///<reference path="../DefinitelyTyped/express/express.d.ts" />
///<reference path="../DefinitelyTyped/passport/passport.d.ts" />
///<reference path="../DefinitelyTyped/passport-facebook/passport-facebook.d.ts" />
///<reference path="./socket.io.d.ts" />
///<reference path="../DefinitelyTyped/q/Q.d.ts" />
"use strict";

import express = require('express');
import http = require('http');
import fs = require('fs');
import url = require('url');
import path = require('path');
import socketio = require('socket.io');
import passport = require('passport');
import passport_facebook = require('passport-facebook');

import Q = require('q');
import util = require('util');

import models = require('./models');

var app = express();
export var server = http.createServer(app);
var io = socketio.listen(server);
var FacebookStrategy = passport_facebook.Strategy;

passport.use(new FacebookStrategy(
    {
        clientID: '296679563842710',
        clientSecret: 'bfa4480fb0279eabcb54abb6b769de8e',
        callbackURL: 'http://localhost/auth/facebook/callback'
    },
    function (accessToken, refreshToken, profile, done) {

    }
));

app.set('views', path.join(path.dirname(__dirname), 'templates'));
app.set('view engine', 'jade');

app.use('/static', express.static(path.join(__dirname, '..', 'static')));
app.use('/scripts', express.static(path.join(__dirname, 'web')));

// to enable sourcemap for debugging; should not be enabled on the production.
app.use('/src/web', express.static(path.join(__dirname, '..', 'src', 'web')));

app.get('/', function (req: express.Request, res: express.Response) {
    var files_root = url.resolve(req.protocol + '://' + req.get('host'), '/static');
    res.render('viewer', {
        'files_root': files_root,
        'pdf_path': 'Sphinx.pdf'
    });
});

app.post('/login', function (req: express.Request, res: express.Response) {
});

app.get('/users', function (req: express.Request, res: express.Response) {

});

enum ErrorCode {
    ParseError = -32700,
    InvalidRequest = -32600,
    MethodNotFound = -32601,
    InvalidParams = -32602,
    InternalError = -32603,
}

function errorMessage(error: ErrorCode) {
    switch (error) {
        case ErrorCode.ParseError: return "Parse error";
        case ErrorCode.InvalidRequest: return "Invalid Request";
        case ErrorCode.MethodNotFound: return "Method not found";
        case ErrorCode.InvalidParams: return "Invalid params";
        case ErrorCode.InternalError: return "Internal error";
        default: throw Error('unknown error code');
    }
}

function buildError(error: ErrorCode, message?: string) {
    message = message || errorMessage(error);
    return {code: error, message: message};
}

interface RequestMessage {
    method: string;
    params: any;
    id: number;
}

class Client {
    private socket: socketio.Socket;
    private channel: {id: string};
    private connected: boolean;

    constructor(socket: socketio.Socket) {
        this.socket = socket;
        this.connected = false;
    }

    handleMessage(msg: RequestMessage): void {
        var socket = this.socket;
        var requestId = msg.id;

        function handleError(error: ErrorCode) {
            socket.json.send({error: buildError(error), id: requestId});
        }

        var method = msg.method,
            params = msg.params;
        if (!method || !params) {
            handleError(ErrorCode.InvalidRequest);
            return;
        }

        if (method !== 'connect' && !this.connected) {
            handleError(ErrorCode.InvalidRequest);
            this.socket.disconnect();
            return;
        }

        var result;
        switch (method) {
            case 'connect': result = this.onConnect(params); break;
            case 'get_slide': result = this.onGetSlide(params); break;
            case 'move_page': result = this.onMovePage(params); break;
            default: handleError(ErrorCode.MethodNotFound); return;
        }
        result.done(function (result) {
            socket.json.send({result: result, id: requestId});
        }, function (error) {
            socket.json.send({error: error, id: requestId});
        });
    }

    onConnect(params: {session: string}): Q.Promise<string> {
        if (this.connected) {
            return Q.reject(buildError(ErrorCode.InvalidRequest));
        }
        var self = this;
        models.SessionCollection.getByKey(params.session).then(function (session) {
            self.channel = session.channel;
            self.socket.join(self.channel.id);
            self.connected = true;
            return 'ok';
        }, function (reason: any) {
            return Q.reject(buildError(ErrorCode.InternalError));
        });
    }

    onGetSlide(params: {}): Q.Promise<any> {
        console.log(util.inspect(this.socket.handshake));
        var hostname = this.socket.handshake.headers.host;
        return this.channel.getSlideInformation(hostname).then(function (info) {
            return {download_URL: info.download_URL, pages: info.pages};
        });
    }

    onMovePage(params: {page: number}): Q.Promise<any> {
        var page = params.page;
        if (typeof page !== 'number') {
            return Q.reject(buildError(ErrorCode.InvalidParams));
        }
        screen.in(this.channel).emit('move_page', {page: page});
        return Q.resolve({page: page});
    }

    onDisconnect() {
        this.socket = null;
        this.connected = false;
    }
}

io.sockets.on('connection', function (socket: socketio.Socket) {
    var client = new Client(socket);
    socket.on('message', client.handleMessage.bind(client));
    socket.on('disconnect', client.onDisconnect.bind(client));
});


var screen = io.of('/screen').on('connection', function (socket: socketio.Socket) {
    var channel = 'test_channel';
    socket.join(channel);
    socket.on('move_page', function (params: {page: number}) {
        var page = params.page;
        socket.broadcast.in(channel).emit('move_page', {page: page});
    });
});
