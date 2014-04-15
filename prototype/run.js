var app = require('./build/server').app;

var host = '127.0.0.1', port = 8008;
app.listen(port, host);
console.log('Server running at http://' + host + ':' + port + '/');
