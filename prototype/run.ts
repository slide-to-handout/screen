///<reference path="node.d.ts" />
"use strict";

import http = require('http');
import fs = require('fs');
import url = require('url');
import path = require('path');

var MIMETYPES = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.pdf': 'application/pdf'
};

process.on('uncaughtException', function (err) {
    console.error(err.stack);
});

var root = process.cwd();

var server = http.createServer(function (req: http.ServerRequest, res: http.ServerResponse) {
    var file = url.parse(req.url).pathname;
    fs.readFile(path.join(root, file), function (err: ErrnoException, data: NodeBuffer) {
        if (err) {
            if (err.code == 'ENOENT' || err.code == 'EISDIR') {
                res.writeHead(404);
                res.write('<!doctype html><html><body><h1>404 Not Found</h1></body></html>');
                res.end();
            } else {
                throw err;
            }
        }
        var mimetype = MIMETYPES[path.extname(file)];
        res.writeHead(200, {'Content-Type': mimetype || 'application/octet-stream'});
        res.end(data);
    });
});

var host = '127.0.0.1', port = 8008;
server.listen(port, host);
console.log('Server running at http://' + host + ':' + port + '/');
