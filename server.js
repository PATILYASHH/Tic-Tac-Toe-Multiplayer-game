const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let players = {};

app.use(express.static(__dirname + '/public'));

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('joinGame', (playerName) => {
        console.log(`${playerName} joined the game.`);
        if (Object.keys(players).length < 2) {
            players[socket.id] = playerName;
            const symbol = Object.keys(players).length === 1 ? 'X' : 'O';
            const opponent = Object.keys(players).find(id => id !== socket.id);
            socket.emit('startGame', { symbol, opponent });
            if (opponent) {
                io.to(opponent).emit('startGame', { symbol: symbol === 'X' ? 'O' : 'X', opponent: socket.id });
            }
        } else {
            socket.emit('status', 'Room is full. Please wait.');
        }
    });

    socket.on('move', (data) => {
        io.to(data.opponent).emit('move', data);
    });

    socket.on('restart', (opponent) => {
        io.to(opponent).emit('restart');
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
        delete players[socket.id];
        socket.broadcast.emit('status', 'Opponent left the game.');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
