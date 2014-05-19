var server = require('./build/server').server;

var host = '127.0.0.1', port = 8008;
server.listen(port, host);
console.log('Server running at http://' + host + ':' + port + '/');
