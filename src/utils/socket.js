import { io } from 'socket.io-client';

let socket = null;

export const getSocket = () => {
  if (!socket) {
    // In dev, connects to window.location.origin (proxied to port 5000) with fallback to direct http://localhost:5000
    const socketUrl = import.meta.env.VITE_SOCKET_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);

    socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      autoConnect: true,
    });

    socket.on('connect', () => {
      console.log('[Socket.io Connected] ID:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket.io Connect Error]:', err.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket.io Disconnected]:', reason);
    });
  }

  return socket;
};

/**
 * Join candidate room to scope private real-time updates
 */
export const joinUserRoom = (userId) => {
  const s = getSocket();
  if (s && userId) {
    s.emit('join_user_room', userId);
    console.log(`[Socket.io] Joined room for user ${userId}`);
  }
};

export default getSocket;
