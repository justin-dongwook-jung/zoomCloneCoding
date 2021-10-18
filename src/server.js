import express from "express";
import http from 'http';
import WebSocket from 'ws';

const app = express();
const PORT = 3000;

app.set('view engine', 'pug');
app.set('views', __dirname + '/views');
app.use('/public', express.static(__dirname + '/public'));
app.get('/', (req, res) => res.render('home'));
app.get('/*', (req, res) => res.redirect('/'));

const server = http.createServer(app);

const wss = new WebSocket.Server({ server })

let sockets = []

wss.on('connection', socket => {
  sockets.push(socket);
  console.log(`Connected to Browser ✅`);
  socket.on('close', () => console.log(`Disconnected from the Browser`))
  socket.on('message', msg => {
    const message = JSON.parse(msg);
    console.log(message)
    switch (message.type) {
      case 'new_message':
        sockets.forEach(elem => {
          elem.send(`${socket.nicknme}: ${message.payload}`)
        })
        break;
      case 'nickname':
        socket['nickname'] = message.payload;
        break;
    }
  })
})

server.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`)
})

