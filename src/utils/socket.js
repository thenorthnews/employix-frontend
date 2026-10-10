import { io } from 'socket.io-client';

let socket = null;

export const getSocket = () => {
  if (!socket) {
    let socketUrl = import.meta.env.VITE_SOCKET_URL;

    if (!socketUrl) {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '';
      if (apiBase.startsWith('http://') || apiBase.startsWith('https://')) {
        try {
          socketUrl = new URL(apiBase).origin;
        } catch {
          socketUrl = `${window.location.protocol}//${window.location.hostname}:5000`;
        }
      } else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        socketUrl = 'http://localhost:5000';
      } else {
        // Live server default: connect to port 5000 on current host
        socketUrl = `${window.location.protocol}//${window.location.hostname}:5000`;
      }
    }

    console.log('[Socket.io Initializing Target URL]:', socketUrl);

    socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
      autoConnect: true,
    });

    socket.on('connect', () => {
      console.log('[Socket.io Connected Successfully] Socket ID:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket.io Connection Error]:', err.message);
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
    if (s.connected) {
      s.emit('join_user_room', String(userId));
      console.log(`[Socket.io] Emitted join_user_room for user ${userId}`);
    } else {
      s.once('connect', () => {
        s.emit('join_user_room', String(userId));
        console.log(`[Socket.io] Connected & Emitted join_user_room for user ${userId}`);
      });
    }
  }
};

export default getSocket;
