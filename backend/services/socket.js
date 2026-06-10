let io;

module.exports = {
  init: (server) => {
    const { Server } = require('socket.io');
    io = new Server(server, {
      cors: {
        origin: '*', // For development flexibility
        methods: ['GET', 'POST'],
      },
    });

    io.on('connection', (socket) => {
      console.log(`[WebSocket Connected] Client ID: ${socket.id}`);
      
      socket.on('disconnect', () => {
        console.log(`[WebSocket Disconnected] Client ID: ${socket.id}`);
      });
    });

    return io;
  },
  
  getIO: () => {
    if (!io) {
      console.warn('[WebSocket warning] io is not initialized yet!');
    }
    return io;
  },

  // Helper function to broadcast events to all clients
  broadcast: (event, data) => {
    if (io) {
      io.emit(event, data);
    }
  }
};
