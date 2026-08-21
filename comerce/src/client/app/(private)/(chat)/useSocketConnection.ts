import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { SOCKET_URL } from "@/app/lib/constants/config";

export const useSocketConnection = (chatId: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const socketInstance = io(SOCKET_URL, {
      withCredentials: true,
    });

    const joinChat = () => {
      socketInstance.emit("joinChat", chatId);
    };

    socketInstance.on("connect", joinChat);
    if (socketInstance.connected) {
      joinChat();
    }

    setSocket(socketInstance);

    return () => {
      socketInstance.off("connect", joinChat);
      socketInstance.disconnect();
      setSocket(null);
    };
  }, [chatId]);

  return socket;
};
