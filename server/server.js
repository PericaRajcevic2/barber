const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
require('dotenv').config();

const app = express();

// Kreiraj HTTP server za Socket.io
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.FRONTEND_URL 
      : "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB spoj s novijom konfiguracijom
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/barber-booking');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

connectDB();

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Novi klijent spojen:', socket.id);
  
  socket.on('join_admin', () => {
    socket.join('admin_room');
    console.log('Admin joined admin room');
  });
  
  socket.on('disconnect', () => {
    console.log('Klijent odspojen:', socket.id);
  });
});

// Export io za korištenje u drugim fileovima
app.set('io', io);

// API Rute - MORAJU biti prije static file servinga!
app.use('/api/services', require('./routes/services'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/working-hours', require('./routes/workingHours'));
app.use('/api/available-slots', require('./routes/availableSlots'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/google', require('./routes/googleAuth'));

// Health check za API
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'Barber Booking API radi!',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Serve static files from React app in production
if (process.env.NODE_ENV === 'production') {
  // Serve static files
  app.use(express.static(path.join(__dirname, 'client/dist')));
  
  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/dist/index.html'));
  });
}

const PORT = process.env.PORT || 5000;

// Promijeni app.listen u server.listen
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📡 Socket.io server je spreman`);
});