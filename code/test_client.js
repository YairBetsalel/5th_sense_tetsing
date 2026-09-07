const { io } = require("socket.io-client");

const PI_IP = "192.168.68.69";


const socket = io(`http://${PI_IP}:3000`, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity
});

socket.on("connect", () => {
    console.log(`\nConnected to Raspberry Pi! Client ID: ${socket.id}`);
    console.log("Waiting for real ESP32 data...");
});

socket.on("esp32_data", (data) => {
    console.log("--- Real ESP32 Data Received ---");
    console.log(JSON.stringify(data, null, 2));
});

socket.on("disconnect", (reason) => {
    console.log(`\nDisconnected from Raspberry Pi (Reason: ${reason})`);
    console.log("Searching for connection...");
});

socket.io.on("reconnect_attempt", (attempt) => {
    console.log(`reconnecting... (Attempt ${attempt})`);
});

socket.on("connect_error", (error) => {
    console.log(`Connection error: ${error.message}`);
});