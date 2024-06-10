import { io } from "https://cdn.socket.io/4.7.4/socket.io.esm.min.js";

const socket = io();
let mode_light = true;

const tdm = document.getElementById('tdm');
const submit_b = document.getElementById('submit_b');
let Stars = document.getElementsByClassName('Stars')[0];

tdm.addEventListener('click', mode_change);
function mode_change() {
    let html_s = document.body.style
    mode_light = !mode_light;
    html_s.setProperty("--color0", mode_light ? "var(--l_color0)" : "var(--d_color0)");
    html_s.setProperty("--color1", mode_light ? "var(--l_color1)" : "var(--d_color1)");
    html_s.setProperty("--color2", mode_light ? "var(--l_color2)" : "var(--d_color2)");
    html_s.setProperty("--color3", mode_light ? "var(--l_color3)" : "var(--d_color3)");
}

submit_b.addEventListener('click', submit);
function submit(){
    let value = document.querySelector('input[name="rating"]:checked').value;
    socket.emit('submit', value);
}

socket.on('uuid_req' , (data) => {
    let uuid = localStorage.getItem('uuid');
    if(uuid == null || data[1] === true){
        localStorage.setItem('uuid', data[0]);
        uuid = data[0];
    }
    socket.emit('uuid', uuid);
});

socket.on('rating', (rating) => {
    Stars.style.setProperty("--rating", rating);
});