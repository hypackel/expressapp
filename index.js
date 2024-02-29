// const express = require('express')
// const path = require('path')

// const PORT = process.env.PORT || 5001

// express()
//   .use(express.static(path.join(__dirname, 'public')))
//   .set('views', path.join(__dirname, 'views'))
//   .set('view engine', 'ejs')
//   .get('/', (req, res) => res.render('pages/index'))
//   .listen(PORT, () => console.log(`Listening on ${ PORT }`))


console.log("Hello, World!");
const fs = require('fs');
const http = require('http');
const WebSocket = require('websocket').server;

// Local variables:
const port = process.env.PORT || 9600; // Use the environment variable for port

// Create the server and listen on the specified port:
const server = http.createServer();

server.listen(port, function() {
    console.log("Server listening on port " + port);
});

// Initialize the WebSocket server:
const wsServer = new WebSocket({
    httpServer: server,
});

const connections = []; // Store active connections

// Handle incoming WebSocket requests:
wsServer.on('request', function(req) {
    const connection = req.accept(null, req.origin);

    connections.push(connection);

    connection.on('message', async function(message) {
        const msg = message.utf8Data;
        const isMessageValid = await checkMessage(msg); // Check if the message contains banned words

        if (isMessageValid) {
            console.log(message);
            // Broadcast the received message to all connected clients:
            for (let i = 0; i < connections.length; i++) {
                connections[i].sendUTF(msg);
            }
        } else {
            // Handle the case when a banned word is found
            console.log('Banned word found:', msg);
            // Send a notification to the client via WebSocket
            const notification = {
                type: 'badword',
                username: "Hypackel Chat Moderation",
                message: 'Someone a bad word, please always use polite language!',
            };
            for (let i = 0; i < connections.length; i++) {
                connections[i].sendUTF(JSON.stringify(notification));
            }
        }
    });

    connection.on('close', function(reasonCode, description) {
        // Remove closed connections from the list:
        const index = connections.indexOf(connection);
        if (index !== -1) {
            connections.splice(index, 1);
        }
    });
    connection.on('open', function(reasonCode, description) {
        // Remove closed connections from the list:
        const index = connections.indexOf(connection);
        console.log(connection);
        console.log(connections);
    });
});

async function checkMessage(message) {
    try {
        // Read the banned words from the text file
        const bannedWords = fs.readFileSync('banned-words.txt', 'utf8').split('\n');

        // Check if the message contains any banned words
        for (const word of bannedWords) {
            if (message.includes(word)) {
                return false;
            }
        }

        // Message does not contain banned words, return true
        return true;
    } catch (error) {
        console.error('Error checking message:', error);
        return false;
    }
}
