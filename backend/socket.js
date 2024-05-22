//

const express = require('express')
const http = require('http')
const socketIo= require('socket.io')
const mysql = require('mysql2')
const cors = require('cors')


const app = express()
app.use(cors())
const server = http.createServer(app)
const io = socketIo(server,{
    cors:{
        origin: '*',
        methods:['GET','POST']
    }
})

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'spotify'
});
function saveMessage(email, message) {
    const sql = 'INSERT into messages (email, text) values (?, ?)';
    connection.query(sql, [email, message], (error, result) => {
        if (error) {
            console.error('Failed to insert message:', error);
            return;
        }
        console.log('Message saved:', result.insertId);
    });
}

server.listen(3004,()=>{
    console.log(`Server is running from http://localhost:3004`)
})

io.on('connection', (socket) => {
    console.log('Client connected');
  
    socket.on('message', (message) => {
      const parsedData = JSON.parse(message);
      if (parsedData.email) {
        saveMessage(parsedData.email, parsedData.message, (error, result) => {
          if (error) {
            console.error('Error saving message:', error);
          } else {
            io.emit('message', message);
          }
        });
      }
    });
})
