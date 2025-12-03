import { Server } from 'socket.io';

let io;

export default function handler(req, res) {
  if (!res.socket.server.io) {
    console.log('Initializing Socket.io server...');
    
    io = new Server(res.socket.server, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    res.socket.server.io = io;

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      socket.on('join-battle', (battleId) => {
        socket.join(`battle-${battleId}`);
        console.log(`Socket ${socket.id} joined battle-${battleId}`);
      });

      socket.on('leave-battle', (battleId) => {
        socket.leave(`battle-${battleId}`);
        console.log(`Socket ${socket.id} left battle-${battleId}`);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });

    console.log('Socket.io server initialized');
  } else {
    console.log('Socket.io server already running');
  }

  res.end();
}

export function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
}
