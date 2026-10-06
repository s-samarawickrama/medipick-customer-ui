/**
 * MediPick — WebSocket API (Priority 3)
 *
 * Endpoints: A13.1
 * Design ref: MediPick_API_Design_Document.md — Section A13
 *
 * Handles real-time connections (e.g. chat messages) via socket.io-client.
 */

// @ts-ignore - bypassing Metro bundler ESM resolution errors for engine.io
import io from 'socket.io-client/dist/socket.io.js';
import type { Socket } from 'socket.io-client';
import { API_BASE_URL, getAccessToken } from './client';
import type { ChatMessage } from './messagesApi';

// ─── WEBSOCKET CLIENT ─────────────────────────────────────────────────────────

export interface OrderSubscription {
  socket: Socket;
  unsubscribe: () => void;
}

/**
 * A13.1 — WSS /api/v1/orders/{orderId}/subscribe
 *
 * Connects to the WebSocket server using the access token and joins the order's room.
 */
export async function subscribeToOrderChat(
  orderId: string,
  onNewMessage: (message: ChatMessage) => void
): Promise<OrderSubscription> {
  
  // --- Real Backend Connection ---
  const token = await getAccessToken();
  
  // Example: Convert https://api.medipick.lk/v1 to wss://api.medipick.lk/v1
  const socketUrl = API_BASE_URL.replace(/^http/, 'ws'); 

  const socket = io(socketUrl, {
    auth: { token: `Bearer ${token}` },
    query: { orderId },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelayMax: 10000,
  });

  socket.on('connect', () => {
    console.log(`[WS] Connected to chat for order ${orderId}`);
  });

  socket.on('new_message', (message: ChatMessage) => {
    onNewMessage(message);
  });

  socket.on('disconnect', () => {
    console.log(`[WS] Disconnected from chat for order ${orderId}`);
  });

  socket.on('connect_error', (err: Error) => {
    console.warn(`[WS] Connection error:`, err.message);
  });

  return {
    socket,
    unsubscribe: () => {
      socket.disconnect();
    },
  };
}
