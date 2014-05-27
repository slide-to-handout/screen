///<reference path="../DefinitelyTyped/node/node.d.ts" />
///<reference path="../DefinitelyTyped/express/express.d.ts" />
///<reference path="./socket.io.d.ts" />
"use strict";

import express = require('express');
import http = require('http');
import fs = require('fs');
import url = require('url');
import path = require('path');
import socketio = require('socket.io');

import util = require('util');

var app = express();
export var server = http.createServer(app);
var io = socketio.listen(server);

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
    private channel: string;
    private connected: boolean;

    constructor(socket: socketio.Socket) {
        this.socket = socket;
        this.connected = false;
    }

    handleMessage(msg: RequestMessage) {
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
        try {
            switch (method) {
                case 'connect': result = this.onConnect(params); break;
                case 'get_slide': result = this.onGetSlide(params); break;
                case 'move_page': result = this.onMovePage(params); break;
                default: handleError(ErrorCode.MethodNotFound); return;
            }
        } catch (e) {
            socket.json.send({error: e.error, id: requestId});
        }
        socket.json.send({result: result, id: requestId});
    }

    onConnect(params: {session: string}) {
        if (this.connected) {
            throw {error: buildError(ErrorCode.InvalidRequest)};
        }
        this.channel = 'test_channel';
        this.socket.join(this.channel);
        this.connected = true;
        return 'ok';
    }

    onGetSlide(params: {}) {
        console.log(util.inspect(this.socket.handshake));
        var hostname = this.socket.handshake.headers.host;
        var download_url = url.resolve('http://' + hostname, '/static/Sphinx.pdf');
        return {download_URL: download_url, pages: 41}
    }

    onMovePage(params: {page: number}) {
        var page = params.page;
        if (typeof page !== 'number') {
            throw {error: buildError(ErrorCode.InvalidParams)};
        }
        screen.in(this.channel).emit('move_page', {page: page});
        return {page: page};
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
