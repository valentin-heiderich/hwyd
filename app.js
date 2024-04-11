let http = require("http");
let socket_io = require("socket.io");
let express = require("express");
const uuid = require("uuid");
const fs = require('fs')

let app = express();
app.use(express.static('public'));
let server = http.createServer(app);
let io = new socket_io.Server(server);

let clients = {};

let ratings = {};
let average_rating = 0;

let last_rating;

function calculate_average() {
    let sum = Object.values(ratings).reduce((accumulator, currentValue) => {return parseInt(accumulator) + parseInt(currentValue)},0);
    average_rating = sum / Object.values(ratings).length;
    io.emit("rating", average_rating);
}

function check_time() {
    let _now = new Date();
    let _date = `${_now.getDate()}-${_now.getMonth()}-${_now.getFullYear()}`;
    if(last_rating !== _date) {
        ratings = {};
        average_rating = 0;
    }
    last_rating = _date;
}

io.on("connection", (socket) => {
    socket.emit("uuid_req", uuid.v4());
    socket.on('uuid', (uuid) => {
        clients[uuid] = socket.id;
        let _data =  JSON.stringify(clients);
        fs.writeFile('clients.json', _data, (err) => {if (err) throw err;})
    });
    socket.emit("rating", average_rating);
    socket.on("submit", (rating) => {
        let _uuid = Object.keys(clients).find(key => clients[key] === socket.id);
        ratings[_uuid] = rating;
        calculate_average();
        check_time();
        let _data =  JSON.stringify(ratings);
        fs.writeFile('ratings.json', _data, (err) => {if (err) throw err;})
    });
});




app.get("/", (req, res) => {res.sendFile(__dirname + "index.html");});
server.listen(8003);