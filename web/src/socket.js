import { io } from "socket.io-client";
let socket;
export const getSocket = () => {
  const token = localStorage.getItem("token");
  if (!socket) socket = io("http://localhost:5000", { autoConnect: false, auth: { token } });
  socket.auth = { token };
  if (!socket.connected) socket.connect();
  return socket;
};
export const disconnectSocket = () => {
  if (socket) socket.disconnect();
};