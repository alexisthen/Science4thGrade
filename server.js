const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(__dirname));

let players = {};

io.on('connection', (socket) => {
    // Add new player
    players[socket.id] = {
        id: socket.id,
        position: { x: 0, y: 0.5, z: 0 },
    };

    // Notify the new player of current players
    socket.emit('currentPlayers', players);

    // Notify other players of the new player
    socket.broadcast.emit('newPlayer', players[socket.id]);

    // Handle player movement
    socket.on('playerMovement', (movementData) => {
        if (players[socket.id]) {
            players[socket.id].position = movementData.position;
            socket.broadcast.emit('playerMoved', players[socket.id]);
        }
    });

    // Remove player on disconnect
    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('disconnect', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
