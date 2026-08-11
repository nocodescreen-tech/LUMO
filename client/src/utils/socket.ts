/// <reference types="vite/client" />
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || (import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace(/\/api$/, '') : window.location.origin);

class SocketService {
  private socket: Socket | null = null;

  connect(userId: string | number) {
    if (this.socket) return this.socket;

    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000, // Ajout d'un délai pour éviter le spam
    });

    this.socket.on('connect', () => {
      // En production, on peut éviter de spammer "Connected"
      if (import.meta.env.DEV) {
          console.log('Connected to WebSocket server');
      }
      this.socket?.emit('join', `user_${userId}`);
    });

    this.socket.on('connect_error', () => {
        // Intercepte l'erreur en silence pour ne pas polluer la console
    });

    this.socket.on('disconnect', () => {
        // Intercepte la déconnexion en silence
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket() {
    return this.socket;
  }
}

export const socketService = new SocketService();
