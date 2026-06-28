import { io, Socket } from "socket.io-client";
import { SERVER_URL } from "./api";
import { storage } from "./storage";
let socket: Socket | undefined;
export async function getSocket() {
  const token = await storage.getItemAsync("token");
  if (!socket)
    socket = io(SERVER_URL, {
      autoConnect: false,
      transports: ["websocket"],
      auth: { token },
    });
  socket.auth = { token };
  if (!socket.connected) socket.connect();
  return socket;
}
export function disconnectSocket() {
  socket?.disconnect();
}
