// src/index.js
const express = require('express');
const cors = require('cors');
const http = require('http'); // Required to create an HTTP server to run Express & Socket.IO
const { Server } = require('socket.io'); // The Socket.IO server class
const connectDB = require('./config/db');
require('dotenv').config();

// --- Route Imports ---
// We import all our route handlers
const authRoutes = require('./routes/authRoutes');
const ingestionRoutes = require('./routes/ingestionRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const alertRoutes = require('./routes/alertRoutes');
const zoneRoutes = require('./routes/zoneRoutes');
const sensorRoutes = require('./routes/sensorRoutes');
const userRoutes = require('./routes/userRoutes');

// --- App & Server Initialization ---
const app = express(); // Initialize the Express application
const server = http.createServer(app); // Create an HTTP server using the Express app
const io = new Server(server, { // Initialize the WebSocket server and attach it to the HTTP server
    cors: {
        origin: "*", // For development, allow connections from any client
        methods: ["GET", "POST"]
    }
});

// --- Database Connection ---
// Connect to our MongoDB database
connectDB();

// --- Core Middlewares ---
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Enable the Express app to parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Enable parsing of URL-encoded bodies

// --- Custom Middleware for WebSockets ---
// This is a clever trick: we make the `io` (WebSocket server) instance
// available on the `req` object for all our route controllers.
app.use((req, res, next) => {
    req.io = io;
    next();
});

// --- API Routes ---
// Health check endpoint to see if the server is running
app.get('/', (req, res) => res.status(200).json({ message: 'E2 Warehouse Monitoring API is running!' }));

// Mount all our specific API routers to their paths
app.use('/api/auth', authRoutes);
app.use('/api/zones', zoneRoutes);
app.use('/api/sensors', sensorRoutes);
app.use('/api/users', userRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ingest', ingestionRoutes);

// --- WebSocket Connection Handling ---
// This block runs every time a new client connects to our WebSocket server
io.on('connection', (socket) => {
    console.log('✅ A user connected via WebSocket:', socket.id);

    // This block runs when that specific client disconnects
    socket.on('disconnect', () => {
        console.log('❌ User disconnected:', socket.id);
    });
});

// --- Server Startup ---
const PORT = process.env.PORT || 5001;
// We listen on the `server` instance, not the `app` instance, to run both HTTP and WebSockets
server.listen(PORT, () => {
    console.log(`Server (including WebSocket) is running on port ${PORT}`);
});