const express = require('express');
const socketIo = require('socket.io');
const mysql = require('mysql2');
const http = require('http');
const cors = require('cors');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'spotify'
});

function checkDatabaseConnection() {
    connection.connect(err => {
        if (err) {
            console.error('Error connecting to the database:', err.stack);
            return;
        }
        console.log('Connected to the database.');
    });
}

function saveMessage(email, text, song, callback) {
    const sql = 'INSERT INTO messages (email, text, song_id, song_name, song_artists) VALUES (?, ?, ?, ?, ?)';
    const songArtists = song ? JSON.stringify(song.artists.map(artist => artist.name)) : null;
    connection.query(sql, [email, text, song?.id, song?.name, songArtists], (error, result) => {
        if (error) {
            console.error('Failed to insert message:', error);
            callback(error, null);
            return;
        }
        console.log('Message saved:', result.insertId);
        callback(null, result);
    });
}

const app = express();
app.use(express.static('.'));
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

app.post('/api/messages', (req, res) => {
    const { email, text, song } = req.body;
    console.log('Received message:', email, text, song); // Debugging line

    saveMessage(email, text, song, (error, result) => {
        if (error) {
            console.error('Failed to insert message:', error);
            return res.status(500).json({ message: 'Failed to save message' });
        }
        console.log('Message saved:', result.insertId);
        res.json({ message: 'Message saved', messageId: result.insertId });

        io.emit('message', JSON.stringify({ email, text, song }));
    });
});

app.get('/api/getmessages', (req, res) => {
    const sql = 'SELECT * FROM messages';
    connection.query(sql, (error, results) => {
        if (error) {
            console.error('Failed to retrieve messages:', error);
            return res.status(500).send('Failed to retrieve messages');
        }
        res.json(results.map(result => ({
            ...result,
            song: result.song_id ? {
                id: result.song_id,
                name: result.song_name,
                artists: JSON.parse(result.song_artists).map(name => ({ name })),
            } : null
        })));
    });
});

server.listen(3001, () => {
    console.log(`Server is running from http://localhost:3001`);
});

checkDatabaseConnection();

io.on('connection', (socket) => {
    console.log('Client connected');

    socket.on('message', (message) => {
        const parsedData = JSON.parse(message);
        if (parsedData.email && (parsedData.text || parsedData.song)) {
            saveMessage(parsedData.email, parsedData.text, parsedData.song, (error, result) => {
                if (error) {
                    console.error('Error saving message:', error);
                } else {
                    io.emit('message', message);
                }
            });
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});
