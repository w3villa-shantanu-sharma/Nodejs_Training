const http = require('http');

const server = http.createServer((req, res) => {
  if (req.url === "/") {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end("Home page");
  } else if (req.url === "/about") {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end("About page");
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end("Not Found");
  }
});

server.listen(3000);


//🔴 Problem: Everything (routing, parsing, status) has to be done manually.

