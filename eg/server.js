var ma = require('../mobileagent.js'),
    http = require('http');

http.createServer(function (req, res) {
    var ma = ma.getMobileAgent(req);

    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Hello ' + ma.getCarrierLongName() + '\n');
}).listen(1337, "127.0.0.1");
console.log('Server running at http://127.0.0.1:1337/');
