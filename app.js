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

let rating_history = {};

let last_rating = "";

function write_file(_file, _data) {
    fs.writeFile(_file, _data, (err) => {if (err) throw err;})
}

function load_data() {
    fs.readFile('clients.json', 'utf8', (err, data) => {
        if(data === "") {return;}
        clients = JSON.parse(data);
    });
    fs.readFile('ratings.json', 'utf8', (err, data) => {
        if(data === "") {return;}
        ratings = JSON.parse(data);
    });
    fs.readFile('rating_history.json', 'utf8', (err, data) => {
        if(data === "") {return;}
        rating_history = JSON.parse(data);
    });
    fs.readFile('lr.json', 'utf8', (err, data) => {
        if(data === "") {return;}
        last_rating = data;
    });
}

load_data();

function calculate_average() {
    let sum = Object.values(ratings).reduce((accumulator, currentValue) => {return parseInt(accumulator) + parseInt(currentValue)},0);
    average_rating = sum / Object.values(ratings).length;
    io.emit("rating", average_rating);
}

function close_day(_date) {
    rating_history[_date] = average_rating;
    ratings = {};
    average_rating = 0;
    io.emit("rating", average_rating);
    write_file('rating_history.json', JSON.stringify(rating_history));
}

function check_time() {
    let _now = new Date();
    let _date = `${_now.getDate()}-${_now.getMonth()+1}-${_now.getFullYear()}`;
    if(last_rating !== _date) {close_day(_date);}
    last_rating = _date;
    write_file('lr.json', JSON.stringify(last_rating));
}

io.on("connection", (socket) => {
    socket.emit("uuid_req", [uuid.v4(), false]);
    socket.on('uuid', (_uuid_ret) => {
        if(_uuid_ret.length !== 36){socket.emit("uuid_req", [uuid.v4(), true]);return;}
        clients[_uuid_ret] = socket.id;
        write_file('clients.json', JSON.stringify(clients));
    });
    socket.emit("rating", average_rating);
    socket.on("submit", (rating) => {
        let _uuid = Object.keys(clients).find(key => clients[key] === socket.id);
        if (_uuid === undefined) {socket.emit("uuid_req", [uuid.v4()]);return;}
        check_time();
        ratings[_uuid] = rating;
        calculate_average();
        write_file('ratings.json', JSON.stringify(ratings));
    });
});

app.get("/", (req, res) => {res.sendFile(__dirname + "index.html");});
server.listen(8003);